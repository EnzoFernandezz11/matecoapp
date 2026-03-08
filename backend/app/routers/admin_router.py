from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.admin_dependencies import require_admin
from app.db.session import get_db
from app.models.round import Round
from app.models.round_member import RoundMember
from app.models.turn import Turn, TurnStatus
from app.models.user import User


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/health")
def admin_health(admin_user: str = Depends(require_admin)) -> dict[str, str]:
    return {"status": "ok", "admin": admin_user}


@router.get("/metrics")
def admin_metrics(db: Session = Depends(get_db)) -> dict[str, int]:
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_rounds = db.scalar(select(func.count(Round.id))) or 0
    total_turns = db.scalar(select(func.count(Turn.id))) or 0
    completed_turns = (
        db.scalar(select(func.count(Turn.id)).where(Turn.status == TurnStatus.completed)) or 0
    )
    skipped_turns = db.scalar(select(func.count(Turn.id)).where(Turn.status == TurnStatus.missed)) or 0

    return {
        "total_users": int(total_users),
        "total_rounds": int(total_rounds),
        "total_turns": int(total_turns),
        "completed_turns": int(completed_turns),
        "skipped_turns": int(skipped_turns),
    }


@router.get("/users")
def admin_list_users(
    q: str = Query(default="", max_length=255),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    base = select(User)
    if q.strip():
        query = f"%{q.strip()}%"
        base = base.where(
            User.name.ilike(query) | User.email.ilike(query) | func.coalesce(User.google_id, "").ilike(query)
        )

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    users = list(
        db.scalars(
            base.order_by(User.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    items = []
    for user in users:
        rounds_joined = db.scalar(
            select(func.count(RoundMember.id)).where(RoundMember.user_id == user.id)
        ) or 0
        turns_completed = db.scalar(
            select(func.count(Turn.id)).where(Turn.user_id == user.id, Turn.status == TurnStatus.completed)
        ) or 0
        turns_skipped = db.scalar(
            select(func.count(Turn.id)).where(Turn.user_id == user.id, Turn.status == TurnStatus.missed)
        ) or 0

        items.append(
            {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "avatar_url": user.avatar_url,
                "google_id": user.google_id,
                "created_at": user.created_at,
                "university": user.university,
                "rounds_joined": int(rounds_joined),
                "turns_completed": int(turns_completed),
                "turns_skipped": int(turns_skipped),
            }
        )

    return {
        "items": items,
        "total": int(total),
        "page": page,
        "page_size": page_size,
    }


@router.get("/rounds")
def admin_list_rounds(
    q: str = Query(default="", max_length=255),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    base = select(Round)
    if q.strip():
        query = f"%{q.strip()}%"
        base = base.where(Round.name.ilike(query) | Round.invite_code.ilike(query))

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rounds = list(
        db.scalars(
            base.order_by(Round.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    items = []
    for round_obj in rounds:
        member_count = db.scalar(
            select(func.count(RoundMember.id)).where(RoundMember.round_id == round_obj.id)
        ) or 0
        current_turn = db.scalar(
            select(Turn).where(Turn.round_id == round_obj.id, Turn.status == TurnStatus.pending).order_by(Turn.turn_index.asc())
        )
        current_turn_user = None
        if current_turn is not None:
            current_turn_user = db.scalar(select(User.name).where(User.id == current_turn.user_id))

        creator_name = db.scalar(select(User.name).where(User.id == round_obj.created_by))

        items.append(
            {
                "id": str(round_obj.id),
                "name": round_obj.name,
                "invite_code": round_obj.invite_code,
                "created_at": round_obj.created_at,
                "creator_name": creator_name,
                "member_count": int(member_count),
                "current_turn_user": current_turn_user,
            }
        )

    return {
        "items": items,
        "total": int(total),
        "page": page,
        "page_size": page_size,
    }


@router.get("/turns")
def admin_list_turns(
    q: str = Query(default="", max_length=255),
    status_filter: TurnStatus | None = Query(default=None, alias="status"),
    round_id: UUID | None = None,
    user_id: UUID | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    base = select(Turn)
    if status_filter is not None:
        base = base.where(Turn.status == status_filter)
    if round_id is not None:
        base = base.where(Turn.round_id == round_id)
    if user_id is not None:
        base = base.where(Turn.user_id == user_id)

    if q.strip():
        query = f"%{q.strip()}%"
        matching_user_ids = select(User.id).where(User.name.ilike(query) | User.email.ilike(query))
        matching_round_ids = select(Round.id).where(Round.name.ilike(query) | Round.invite_code.ilike(query))
        base = base.where(Turn.user_id.in_(matching_user_ids) | Turn.round_id.in_(matching_round_ids))

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    turns = list(
        db.scalars(
            base.order_by(Turn.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    items = []
    for turn in turns:
        user_name = db.scalar(select(User.name).where(User.id == turn.user_id))
        round_name = db.scalar(select(Round.name).where(Round.id == turn.round_id))
        items.append(
            {
                "id": str(turn.id),
                "round_id": str(turn.round_id),
                "round_name": round_name,
                "user_id": str(turn.user_id),
                "user_name": user_name,
                "turn_index": turn.turn_index,
                "status": turn.status.value,
                "excuse": turn.excuse,
                "created_at": turn.created_at,
            }
        )

    return {
        "items": items,
        "total": int(total),
        "page": page,
        "page_size": page_size,
    }
