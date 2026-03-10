from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import case, delete, func, or_, select, update
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.penalty import Penalty
from app.models.push_subscription import PushSubscription
from app.models.round import Round
from app.models.round_member import RoundMember
from app.models.turn import Turn, TurnStatus
from app.models.university import University, UniversityAlias, UniversityStatus
from app.models.user import User
from app.schemas.university_schema import (
    AdminMergeUniversityRequest,
    AdminRenameUniversityRequest,
    UniversityResponse,
)
from app.schemas.admin_schema import (
    AdminStatsRecentUser,
    AdminStatsResponse,
    AdminUpdateUserRequest,
    AdminUserDetailResponse,
    AdminUserListItem,
    AdminUserRoundSummary,
    AdminUsersListResponse,
)
from app.services.turn_notification_service import send_daily_turn_notifications
from app.services.university_service import normalize_university_text


router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminStatsResponse:
    _ = admin_user
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    total_rounds = db.scalar(select(func.count()).select_from(Round)) or 0
    last_week = datetime.now(timezone.utc) - timedelta(days=7)
    new_users = (
        db.scalar(select(func.count()).select_from(User).where(User.created_at >= last_week))
        or 0
    )
    recent_users = list(
        db.scalars(select(User).order_by(User.created_at.desc()).limit(8)).all()
    )
    return AdminStatsResponse(
        total_users=total_users,
        new_users_last_7_days=new_users,
        total_rounds=total_rounds,
        recent_users=[
            AdminStatsRecentUser(
                id=user.id,
                name=user.name,
                email=user.email,
                created_at=user.created_at,
            )
            for user in recent_users
        ],
    )


@router.get("/users", response_model=AdminUsersListResponse)
def list_admin_users(
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminUsersListResponse:
    _ = admin_user
    pattern = f"%{(search or '').strip()}%"

    filters = []
    if search and search.strip():
        filters.append(
            or_(
                User.name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    total_stmt = select(func.count()).select_from(User)
    if filters:
        total_stmt = total_stmt.where(*filters)
    total = db.scalar(total_stmt) or 0

    stmt = (
        select(
            User.id,
            User.name,
            User.email,
            User.created_at,
            func.count(RoundMember.id).label("mesas_joined"),
        )
        .select_from(User)
        .outerjoin(RoundMember, RoundMember.user_id == User.id)
        .group_by(User.id, User.name, User.email, User.created_at)
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if filters:
        stmt = stmt.where(*filters)
    rows = db.execute(stmt).all()

    return AdminUsersListResponse(
        items=[
            AdminUserListItem(
                id=row.id,
                name=row.name,
                email=row.email,
                created_at=row.created_at,
                mesas_joined=row.mesas_joined or 0,
            )
            for row in rows
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


def _get_admin_user_detail_or_404(db: Session, user_id: UUID) -> AdminUserDetailResponse:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    rounds_rows = db.execute(
        select(Round.id, Round.name, RoundMember.joined_at)
        .join(RoundMember, RoundMember.round_id == Round.id)
        .where(RoundMember.user_id == user_id)
        .order_by(RoundMember.joined_at.desc())
    ).all()

    turns_row = db.execute(
        select(
            func.count(Turn.id).label("turns_total"),
            func.coalesce(
                func.sum(case((Turn.status == TurnStatus.confirmed, 1), else_=0)),
                0,
            ).label("turns_completed"),
            func.coalesce(
                func.sum(case((Turn.status == TurnStatus.skipped, 1), else_=0)),
                0,
            ).label("turns_missed"),
        ).where(Turn.user_id == user_id)
    ).one()

    return AdminUserDetailResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at,
        mesas_joined=len(rounds_rows),
        rounds=[
            AdminUserRoundSummary(
                id=row.id,
                name=row.name,
                joined_at=row.joined_at,
            )
            for row in rounds_rows
        ],
        turns_total=turns_row.turns_total or 0,
        turns_completed=turns_row.turns_completed or 0,
        turns_missed=turns_row.turns_missed or 0,
    )


@router.get("/users/{user_id}", response_model=AdminUserDetailResponse)
def get_admin_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminUserDetailResponse:
    _ = admin_user
    return _get_admin_user_detail_or_404(db, user_id)


@router.put("/users/{user_id}", response_model=AdminUserDetailResponse)
def update_admin_user(
    user_id: UUID,
    payload: AdminUpdateUserRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminUserDetailResponse:
    target_user = db.scalar(select(User).where(User.id == user_id))
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    normalized_email = payload.email.strip().lower()
    existing = db.scalar(select(User).where(User.email == normalized_email, User.id != user_id))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use",
        )

    target_user.name = payload.name.strip()
    target_user.email = normalized_email
    db.commit()
    return _get_admin_user_detail_or_404(db, user_id)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> Response:
    target_user = db.scalar(select(User).where(User.id == user_id))
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target_user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user cannot be deleted",
        )

    # Reassign created rounds to the current admin to preserve data integrity.
    db.execute(
        update(Round)
        .where(Round.created_by == target_user.id)
        .values(created_by=admin_user.id)
    )
    db.execute(delete(RoundMember).where(RoundMember.user_id == target_user.id))
    db.execute(delete(Turn).where(Turn.user_id == target_user.id))
    db.execute(delete(Penalty).where(Penalty.user_id == target_user.id))
    db.execute(delete(PushSubscription).where(PushSubscription.user_id == target_user.id))
    db.delete(target_user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/notifications/run")
def run_daily_notifications(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> dict[str, int]:
    _ = admin_user
    sent = send_daily_turn_notifications(db)
    return {"sent": sent}


@router.get("/universities", response_model=list[UniversityResponse])
def admin_list_universities(
    search: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> list[UniversityResponse]:
    _ = admin_user
    stmt = select(University).where(University.status != UniversityStatus.deleted)
    if search and search.strip():
        pattern = f"%{normalize_university_text(search)}%"
        stmt = stmt.where(University.normalized_name.ilike(pattern))
    universities = list(db.scalars(stmt.order_by(University.name.asc()).limit(limit)).all())
    return [UniversityResponse.model_validate(item) for item in universities]


@router.patch("/universities/{university_id}/rename", response_model=UniversityResponse)
def admin_rename_university(
    university_id: UUID,
    payload: AdminRenameUniversityRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> UniversityResponse:
    _ = admin_user
    university = db.scalar(select(University).where(University.id == university_id))
    if university is None or university.status == UniversityStatus.deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")

    university.name = payload.name.strip()
    university.normalized_name = normalize_university_text(university.name)
    db.add(
        UniversityAlias(
            university_id=university.id,
            alias=university.name,
            normalized_alias=university.normalized_name,
            source="admin",
        )
    )
    db.commit()
    db.refresh(university)
    return UniversityResponse.model_validate(university)


@router.post("/universities/{university_id}/merge", response_model=UniversityResponse)
def admin_merge_university(
    university_id: UUID,
    payload: AdminMergeUniversityRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> UniversityResponse:
    _ = admin_user
    if university_id == payload.target_university_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot merge into itself")

    source = db.scalar(select(University).where(University.id == university_id))
    target = db.scalar(select(University).where(University.id == payload.target_university_id))
    if source is None or target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    if source.status == UniversityStatus.deleted or target.status == UniversityStatus.deleted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid university state")

    db.execute(update(User).where(User.university_id == source.id).values(university_id=target.id, university=target.name))
    db.execute(update(UniversityAlias).where(UniversityAlias.university_id == source.id).values(university_id=target.id))
    source.status = UniversityStatus.merged
    source.merged_into_university_id = target.id
    db.commit()
    db.refresh(target)
    return UniversityResponse.model_validate(target)


@router.delete("/universities/{university_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_university(
    university_id: UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> Response:
    _ = admin_user
    university = db.scalar(select(University).where(University.id == university_id))
    if university is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")

    db.execute(
        update(User)
        .where(User.university_id == university.id)
        .values(university_id=None)
    )
    university.status = UniversityStatus.deleted
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
