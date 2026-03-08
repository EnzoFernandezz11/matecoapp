from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.turn import Turn, TurnStatus
from app.schemas.turn_schema import TurnActionResponse
from app.services.round_service import apply_missed_penalty, get_round_or_404


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
    stmt = select(Turn).options(joinedload(Turn.user)).where(Turn.id == turn_id)
    turn = db.scalar(stmt)
    if turn is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Turn not found"
        )
    return turn


def _queue_next_turn(db: Session, current_turn: Turn) -> Turn:
    round_obj = get_round_or_404(db, current_turn.round_id)
    ordered_members = sorted(round_obj.members, key=lambda member: member.joined_at)
    if not ordered_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Round has no members"
        )

    next_index = current_turn.turn_index + 1
    next_member = ordered_members[next_index % len(ordered_members)]
    next_turn = Turn(
        round_id=current_turn.round_id,
        user_id=next_member.user_id,
        turn_index=next_index,
        status=TurnStatus.pending,
    )
    db.add(next_turn)
    db.flush()
    db.refresh(next_turn)
    return next_turn


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
    if turn.status != TurnStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Turn already resolved"
        )

    turn.status = TurnStatus.completed
    next_turn = _queue_next_turn(db, turn)
    db.commit()
    db.refresh(turn)
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
    if turn.status != TurnStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Turn already resolved"
        )

    turn.status = TurnStatus.missed
    turn.excuse = excuse
    penalty = apply_missed_penalty(db, round_obj, turn.user_id)
    next_turn = _queue_next_turn(db, turn)
    db.commit()
    db.refresh(turn)
    db.refresh(next_turn)
    return TurnActionResponse(
        turn=turn,
        next_turn=next_turn,
        penalty=penalty.type if penalty else None,
    )
