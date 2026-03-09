from datetime import datetime
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.turn import Turn, TurnStatus
from app.schemas.turn_schema import TurnActionResponse
from app.services.round_service import (
    apply_missed_penalty,
    ensure_turns_scheduled,
    get_round_or_404,
)

logger = logging.getLogger(__name__)


def _can_manage_turn(
    db: Session, round_id: UUID, turn_user_id: UUID, actor_user_id: UUID
) -> bool:
    if turn_user_id == actor_user_id:
        return True
    round_obj = get_round_or_404(db, round_id)
    return round_obj.created_by == actor_user_id


def _ensure_round_active_today(round_active_days: list[int]) -> None:
    today = datetime.now().weekday()
    if today not in round_active_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Today is not an active day for this round",
        )


def _get_turn_or_404(db: Session, turn_id: UUID) -> Turn:
    stmt = (
        select(Turn)
        .where(Turn.id == turn_id)
        .with_for_update(of=Turn)
    )
    turn = db.scalar(stmt)
    if turn is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Turn not found"
        )
    return turn


def _queue_reassigned_turn(db: Session, current_turn: Turn) -> Turn:
    round_obj = get_round_or_404(db, current_turn.round_id)
    ensure_turns_scheduled(db, round_obj, current_turn.turn_date)
    ordered_members = sorted(round_obj.members, key=lambda member: member.joined_at)
    if not ordered_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Round has no members"
        )

    member_ids = [member.user_id for member in ordered_members]
    try:
        current_member_position = member_ids.index(current_turn.user_id)
    except ValueError:
        current_member_position = 0
    next_member = ordered_members[(current_member_position + 1) % len(ordered_members)]
    next_index = max((turn.turn_index for turn in round_obj.turns), default=current_turn.turn_index) + 1
    next_turn = Turn(
        round_id=current_turn.round_id,
        user_id=next_member.user_id,
        turn_date=current_turn.turn_date,
        turn_index=next_index,
        status=TurnStatus.reassigned,
    )
    db.add(next_turn)
    db.flush()
    db.refresh(next_turn)
    return next_turn


def _get_next_open_turn(db: Session, round_id: UUID) -> Turn | None:
    stmt = (
        select(Turn)
        .where(
            Turn.round_id == round_id,
            Turn.status.in_([TurnStatus.pending, TurnStatus.reassigned]),
        )
        .order_by(Turn.turn_date.asc(), Turn.turn_index.asc())
    )
    return db.scalar(stmt)


def complete_turn(
    db: Session, turn_id: UUID, actor_user_id: UUID
) -> TurnActionResponse:
    turn = _get_turn_or_404(db, turn_id)
    round_obj = get_round_or_404(db, turn.round_id)
    _ensure_round_active_today(round_obj.active_days)
    if not _can_manage_turn(db, turn.round_id, turn.user_id, actor_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You cannot resolve this turn"
        )
    if turn.status not in {TurnStatus.pending, TurnStatus.reassigned}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Turn already resolved"
        )

    turn.status = TurnStatus.confirmed
    next_turn = _get_next_open_turn(db, turn.round_id)
    db.commit()
    logger.info(
        "Turn confirmed turn_id=%s round_id=%s actor_user_id=%s",
        turn.id,
        turn.round_id,
        actor_user_id,
    )
    db.refresh(turn)
    if next_turn is not None:
        db.refresh(next_turn)
    return TurnActionResponse(turn=turn, next_turn=next_turn, penalty=None)


def miss_turn(
    db: Session, turn_id: UUID, actor_user_id: UUID, excuse: str | None = None
) -> TurnActionResponse:
    turn = _get_turn_or_404(db, turn_id)
    round_obj = get_round_or_404(db, turn.round_id)
    _ensure_round_active_today(round_obj.active_days)
    if not _can_manage_turn(db, turn.round_id, turn.user_id, actor_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You cannot resolve this turn"
        )
    if turn.status not in {TurnStatus.pending, TurnStatus.reassigned}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Turn already resolved"
        )

    turn.status = TurnStatus.skipped
    turn.excuse = excuse
    penalty = apply_missed_penalty(
        db,
        round_obj,
        turn.user_id,
        turn.id,
        description=excuse,
    )
    next_turn = _queue_reassigned_turn(db, turn)
    db.commit()
    logger.info(
        "Turn skipped turn_id=%s round_id=%s actor_user_id=%s penalty=%s reassigned_turn_id=%s",
        turn.id,
        turn.round_id,
        actor_user_id,
        penalty.type.value if penalty else None,
        next_turn.id,
    )
    db.refresh(turn)
    db.refresh(next_turn)
    return TurnActionResponse(
        turn=turn,
        next_turn=next_turn,
        penalty=penalty.type if penalty else None,
    )
