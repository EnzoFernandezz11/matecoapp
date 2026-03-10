from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload

from app.models.penalty import Penalty, PenaltyType
from app.models.round import PenaltyMode, Round
from app.models.round_member import RoundMember
from app.models.turn import Turn, TurnStatus
from app.models.user import User
from app.schemas.round_schema import (
    PenaltyResponse,
    RankingEntry,
    RoundDetailResponse,
    TurnSummary,
    UpcomingTurnSummary,
)
from app.utils.invite_code import generate_invite_code
from app.utils.turn_algorithm import get_member_by_turn_index

logger = logging.getLogger(__name__)


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
        joinedload(Round.penalties).joinedload(Penalty.user),
    )


def _next_scheduled_date(active_days: list[int], start_date: date) -> date:
    active = set(active_days)
    for delta in range(0, 15):
        candidate = start_date + timedelta(days=delta)
        if candidate.weekday() in active:
            return candidate
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Round has no valid active days",
    )


def _build_turn_summary(turn: Turn | None) -> TurnSummary | None:
    if turn is None:
        return None
    return TurnSummary(
        id=turn.id,
        user_id=turn.user_id,
        user_name=turn.user.name,
        turn_date=turn.turn_date,
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
            if turn.status == TurnStatus.confirmed:
                stats[name]["mates"] += 1
            elif turn.status == TurnStatus.skipped:
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


def _build_penalties(round_obj: Round) -> list[PenaltyResponse]:
    return [
        PenaltyResponse(
            id=penalty.id,
            round_id=penalty.round_id,
            user_id=penalty.user_id,
            user_name=penalty.user.name,
            turn_id=penalty.turn_id,
            type=penalty.type,
            description=penalty.description,
            resolved=penalty.resolved,
            created_at=penalty.created_at,
        )
        for penalty in sorted(round_obj.penalties, key=lambda item: item.created_at, reverse=True)
    ]


def _create_turn_for_round(
    db: Session,
    round_obj: Round,
    turn_index: int,
    turn_date: date,
    status: TurnStatus = TurnStatus.pending,
) -> Turn:
    ordered_members = sorted(round_obj.members, key=lambda member: member.joined_at)
    member_ids = [member.user_id for member in ordered_members]
    next_user_id = get_member_by_turn_index(member_ids, turn_index)
    turn = Turn(
        round_id=round_obj.id,
        user_id=next_user_id,
        turn_date=turn_date,
        turn_index=turn_index,
        status=status,
    )
    db.add(turn)
    db.flush()
    db.refresh(turn)
    return turn


def ensure_turns_scheduled(db: Session, round_obj: Round, until_date: date) -> None:
    if not round_obj.members:
        return
    last_index = max((turn.turn_index for turn in round_obj.turns), default=-1)
    last_date = max((turn.turn_date for turn in round_obj.turns), default=None)
    if last_date is None:
        next_date = _next_scheduled_date(round_obj.active_days, datetime.now().date())
    else:
        next_date = last_date + timedelta(days=1)

    while next_date <= until_date:
        if next_date.weekday() in set(round_obj.active_days):
            last_index += 1
            created = _create_turn_for_round(db, round_obj, last_index, next_date, TurnStatus.pending)
            round_obj.turns.append(created)
        next_date += timedelta(days=1)
    db.flush()


def _get_effective_turn(turns: list[Turn]) -> Turn | None:
    if not turns:
        return None
    ordered = sorted(turns, key=lambda item: item.turn_index)
    for turn in reversed(ordered):
        if turn.status in {TurnStatus.pending, TurnStatus.reassigned, TurnStatus.confirmed}:
            return turn
    return ordered[-1]


def get_effective_turn_for_round_date(round_obj: Round, target_date: date) -> Turn | None:
    turns = [turn for turn in round_obj.turns if turn.turn_date == target_date]
    return _get_effective_turn(turns)


def _build_upcoming_turns(round_obj: Round, today: date) -> list[UpcomingTurnSummary]:
    grouped: dict[date, list[Turn]] = defaultdict(list)
    for turn in round_obj.turns:
        if turn.turn_date >= today:
            grouped[turn.turn_date].append(turn)

    items: list[UpcomingTurnSummary] = []
    for turn_date in sorted(grouped.keys()):
        effective = _get_effective_turn(grouped[turn_date])
        if effective is None:
            continue
        items.append(
            UpcomingTurnSummary(
                id=effective.id,
                date=turn_date,
                user_id=effective.user_id,
                user_name=effective.user.name,
                status=effective.status,
            )
        )
        if len(items) >= 6:
            break
    return items


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

    first_date = _next_scheduled_date(active_days, datetime.now().date())
    created_turn = _create_turn_for_round(db, round_obj, turn_index=0, turn_date=first_date)
    round_obj.turns.append(created_turn)
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
    rounds = list(db.scalars(stmt).unique().all())
    for round_obj in rounds:
        ensure_turns_scheduled(db, round_obj, datetime.now().date() + timedelta(days=7))
    db.commit()
    return rounds


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
    today = datetime.now().date()
    ensure_turns_scheduled(db, round_obj, today + timedelta(days=14))
    db.commit()
    round_obj = get_round_or_404(db, round_id)

    current_turn = get_effective_turn_for_round_date(round_obj, today)

    from app.services.vote_service import get_active_vote, get_latest_closed_vote
    active_vote = get_active_vote(db, round_id, user_id)
    latest_vote_result = get_latest_closed_vote(db, round_id, user_id)

    return RoundDetailResponse(
        round=round_obj,
        members=sorted(round_obj.members, key=lambda item: item.joined_at),
        current_turn=_build_turn_summary(current_turn),
        upcoming_turns=_build_upcoming_turns(round_obj, today),
        penalties=_build_penalties(round_obj),
        ranking=_build_ranking(round_obj),
        active_vote=active_vote,
        latest_vote_result=latest_vote_result,
    )


def _recalculate_pending_turns(db: Session, round_id: UUID) -> None:
    """Reassign future pending turns based on the current member list."""
    today = datetime.now().date()

    ordered_members = list(
        db.scalars(
            select(RoundMember)
            .where(RoundMember.round_id == round_id)
            .order_by(RoundMember.joined_at.asc())
        ).all()
    )
    member_ids = [m.user_id for m in ordered_members]
    if not member_ids:
        return

    pending_turns = list(
        db.scalars(
            select(Turn).where(
                Turn.round_id == round_id,
                Turn.turn_date >= today,
                Turn.status == TurnStatus.pending,
            )
        ).all()
    )

    for turn in pending_turns:
        new_user_id = get_member_by_turn_index(member_ids, turn.turn_index)
        if turn.user_id != new_user_id:
            turn.user_id = new_user_id
    db.flush()


def join_round(db: Session, round_id: UUID, user: User) -> Round:
    round_obj = get_round_or_404(db, round_id)
    if _ensure_member(db, round_id, user.id) is not None:
        return round_obj

    membership = RoundMember(round_id=round_id, user_id=user.id)
    db.add(membership)
    db.flush()

    _recalculate_pending_turns(db, round_id)
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

    if remaining_members:
        _recalculate_pending_turns(db, round_id)
    else:
        open_turns = list(
            db.scalars(
                select(Turn).where(
                    Turn.round_id == round_id,
                    Turn.status.in_([TurnStatus.pending, TurnStatus.reassigned]),
                )
            ).all()
        )
        for turn in open_turns:
            db.delete(turn)

    db.commit()


def build_invite_link(round_obj: Round) -> str:
    from app.core.config import get_settings
    base = get_settings().frontend_url.rstrip("/")
    return f"{base}/rondas/join/{round_obj.invite_code}"


def apply_missed_penalty(
    db: Session, round_obj: Round, user_id: UUID, turn_id: UUID, description: str | None = None
) -> Penalty | None:
    if round_obj.penalty_mode == PenaltyMode.vote:
        from app.services.vote_service import create_vote_session
        create_vote_session(db, round_obj.id, user_id, turn_id)
        return None

    existing_penalty = db.scalar(select(Penalty).where(Penalty.turn_id == turn_id))
    if existing_penalty is not None:
        logger.warning(
            "Skipping duplicate penalty creation for turn_id=%s in round_id=%s",
            turn_id,
            round_obj.id,
        )
        return existing_penalty

    penalty = Penalty(
        round_id=round_obj.id,
        user_id=user_id,
        turn_id=turn_id,
        type=PenaltyType.double_turn,
        description=description,
    )
    db.add(penalty)
    logger.info(
        "Penalty created for round_id=%s turn_id=%s user_id=%s type=%s",
        round_obj.id,
        turn_id,
        user_id,
        PenaltyType.double_turn.value,
    )
    return penalty


def get_current_turn(db: Session, round_id: UUID, user_id: UUID) -> Turn:
    if _ensure_member(db, round_id, user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not a round member"
        )

    round_obj = get_round_or_404(db, round_id)
    today = datetime.now().date()
    ensure_turns_scheduled(db, round_obj, today + timedelta(days=14))
    db.commit()
    round_obj = get_round_or_404(db, round_id)

    turn = get_effective_turn_for_round_date(round_obj, today)
    if turn is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Current turn not found"
        )
    return turn


def resolve_penalty(
    db: Session, round_id: UUID, penalty_id: UUID, actor_user_id: UUID
) -> Penalty:
    round_obj = get_round_or_404(db, round_id)
    if _ensure_member(db, round_id, actor_user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not a round member"
        )
    if round_obj.created_by != actor_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the round admin can resolve penalties",
        )

    penalty = db.scalar(
        select(Penalty)
        .options(joinedload(Penalty.user))
        .where(Penalty.id == penalty_id, Penalty.round_id == round_id)
    )
    if penalty is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Penalty not found",
        )
    if not penalty.resolved:
        penalty.resolved = True
        db.commit()
    db.refresh(penalty)
    logger.info(
        "Penalty resolved penalty_id=%s round_id=%s actor_user_id=%s",
        penalty_id,
        round_id,
        actor_user_id,
    )
    return penalty
