from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload

from app.models.penalty import Penalty, PenaltyType
from app.models.round import PenaltyMode, Round
from app.models.round_member import RoundMember
from app.models.turn import Turn, TurnStatus
from app.models.user import User
from app.schemas.round_schema import RankingEntry, RoundDetailResponse, TurnSummary
from app.utils.invite_code import generate_invite_code
from app.utils.turn_algorithm import get_member_by_turn_index


def _ensure_member(db: Session, round_id: UUID, user_id: UUID) -> RoundMember | None:
    stmt = select(RoundMember).where(
        RoundMember.round_id == round_id,
        RoundMember.user_id == user_id,
    )
    return db.scalar(stmt)


def _get_round_query() -> Select[tuple[Round]]:
    return select(Round).options(
        joinedload(Round.members).joinedload(RoundMember.user),
        joinedload(Round.turns).joinedload(Turn.user),
        joinedload(Round.penalties),
    )


def _build_turn_summary(turn: Turn | None) -> TurnSummary | None:
    if turn is None:
        return None
    return TurnSummary(
        id=turn.id,
        user_id=turn.user_id,
        user_name=turn.user.name,
        turn_index=turn.turn_index,
        status=turn.status,
        excuse=turn.excuse,
        created_at=turn.created_at,
    )


def _build_ranking(round_obj: Round) -> list[RankingEntry]:
    entries = []

    stats = {}
    for member in round_obj.members:
        stats[member.user.name] = {
            "mates": 0,
            "missed": 0,
            "joined_at": member.joined_at,
        }

    for turn in round_obj.turns:
        name = turn.user.name
        if name in stats:
            if turn.status == TurnStatus.completed:
                stats[name]["mates"] += 1
            elif turn.status == TurnStatus.missed:
                stats[name]["missed"] += 1

    max_mates = max([s["mates"] for s in stats.values()] + [0])
    max_missed = max([s["missed"] for s in stats.values()] + [0])
    now = datetime.now(timezone.utc)

    for name, s in stats.items():
        role = None
        if s["mates"] > 0 and s["mates"] == max_mates:
            role = "MVP"
        elif s["missed"] > 0 and s["missed"] == max_missed:
            role = "RATA"
        elif s["mates"] == 0 and s["missed"] == 0:
            days_since_joined = (now - s["joined_at"]).days
            if days_since_joined > 14:
                role = "FANTASMA"

        entries.append(
            RankingEntry(user=name, mates=s["mates"], missed=s["missed"], role=role)
        )

    entries.sort(key=lambda e: (-e.mates, e.missed, e.user))
    return entries


def _create_turn_for_round(db: Session, round_obj: Round, turn_index: int) -> Turn:
    ordered_members = sorted(round_obj.members, key=lambda member: member.joined_at)
    member_ids = [member.user_id for member in ordered_members]
    next_user_id = get_member_by_turn_index(member_ids, turn_index)
    turn = Turn(
        round_id=round_obj.id,
        user_id=next_user_id,
        turn_index=turn_index,
        status=TurnStatus.pending,
    )
    db.add(turn)
    return turn


def create_round(
    db: Session,
    creator: User,
    name: str,
    penalty_mode: PenaltyMode,
    active_days: list[int],
) -> Round:
    invite_code = generate_invite_code()
    while db.scalar(select(Round).where(Round.invite_code == invite_code)) is not None:
        invite_code = generate_invite_code()

    round_obj = Round(
        name=name,
        created_by=creator.id,
        invite_code=invite_code,
        penalty_mode=penalty_mode,
        active_days=active_days,
    )
    db.add(round_obj)
    db.flush()

    membership = RoundMember(round_id=round_obj.id, user_id=creator.id)
    db.add(membership)
    db.flush()
    db.refresh(membership)
    round_obj.members.append(membership)

    _create_turn_for_round(db, round_obj, turn_index=0)
    db.commit()

    stmt = _get_round_query().where(Round.id == round_obj.id)
    return db.scalars(stmt).unique().one()


def list_user_rounds(db: Session, user_id: UUID) -> list[Round]:
    stmt = (
        _get_round_query()
        .join(RoundMember, RoundMember.round_id == Round.id)
        .where(RoundMember.user_id == user_id)
        .order_by(Round.created_at.desc())
    )
    return list(db.scalars(stmt).unique().all())


def get_round_or_404(db: Session, round_id: UUID) -> Round:
    stmt = _get_round_query().where(Round.id == round_id)
    round_obj = db.scalars(stmt).unique().first()
    if round_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Round not found"
        )
    return round_obj


def get_round_detail(db: Session, round_id: UUID, user_id: UUID) -> RoundDetailResponse:
    round_obj = get_round_or_404(db, round_id)
    if _ensure_member(db, round_id, user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not a round member"
        )

    current_turn = next(
        (
            turn
            for turn in sorted(round_obj.turns, key=lambda item: item.turn_index)
            if turn.status == TurnStatus.pending
        ),
        None,
    )

    return RoundDetailResponse(
        round=round_obj,
        members=sorted(round_obj.members, key=lambda item: item.joined_at),
        current_turn=_build_turn_summary(current_turn),
        ranking=_build_ranking(round_obj),
    )


def join_round(db: Session, round_id: UUID, user: User) -> Round:
    round_obj = get_round_or_404(db, round_id)
    if _ensure_member(db, round_id, user.id) is not None:
        return round_obj

    membership = RoundMember(round_id=round_id, user_id=user.id)
    db.add(membership)
    db.commit()
    return get_round_or_404(db, round_id)


def join_round_by_code(db: Session, invite_code: str, user: User) -> Round:
    stmt = _get_round_query().where(Round.invite_code == invite_code.upper())
    round_obj = db.scalars(stmt).unique().first()
    if round_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite code"
        )
    return join_round(db, round_obj.id, user)


def leave_round(db: Session, round_id: UUID, user: User) -> None:
    round_obj = get_round_or_404(db, round_id)
    membership = _ensure_member(db, round_id, user.id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found"
        )
    if round_obj.created_by == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Round creator cannot leave the round",
        )

    db.delete(membership)
    db.flush()

    remaining_members = list(
        db.scalars(
            select(RoundMember)
            .where(RoundMember.round_id == round_id)
            .order_by(RoundMember.joined_at.asc())
        ).all()
    )

    pending_turns = list(
        db.scalars(
            select(Turn).where(
                Turn.round_id == round_id,
                Turn.status == TurnStatus.pending,
                Turn.user_id == user.id,
            )
        ).all()
    )

    if remaining_members:
        for turn in pending_turns:
            next_member = remaining_members[turn.turn_index % len(remaining_members)]
            turn.user_id = next_member.user_id
    else:
        for turn in pending_turns:
            db.delete(turn)

    db.commit()


def build_invite_link(round_obj: Round) -> str:
    return f"mateco.app/join/{round_obj.invite_code}"


def apply_missed_penalty(
    db: Session, round_obj: Round, user_id: UUID
) -> Penalty | None:
    if round_obj.penalty_mode == PenaltyMode.vote:
        return None

    penalty = Penalty(
        round_id=round_obj.id,
        user_id=user_id,
        type=PenaltyType.double_turn,
    )
    db.add(penalty)
    return penalty


def get_current_turn(db: Session, round_id: UUID, user_id: UUID) -> Turn:
    if _ensure_member(db, round_id, user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not a round member"
        )

    stmt = (
        select(Turn)
        .options(joinedload(Turn.user))
        .where(Turn.round_id == round_id, Turn.status == TurnStatus.pending)
        .order_by(Turn.turn_index.asc())
    )
    turn = db.scalar(stmt)
    if turn is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Current turn not found"
        )
    return turn
