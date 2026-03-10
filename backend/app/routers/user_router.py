from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.university import University, UniversityStatus
from app.models.user import User
from app.schemas.user_schema import UpdateMyUniversityRequest, UserResponse


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_user_profile(user=Depends(get_current_user)) -> UserResponse:
    return user


@router.patch("/me/university", response_model=UserResponse)
def update_my_university(
    payload: UpdateMyUniversityRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserResponse:
    university = db.scalar(
        select(University).where(
            University.id == payload.university_id,
            University.status.in_([UniversityStatus.active, UniversityStatus.pending_review]),
        )
    )
    if university is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")

    user.university_id = university.id
    user.university = university.name
    user.university_prompt_dismissed_at = None
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/university/skip", response_model=UserResponse)
def skip_university_onboarding(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserResponse:
    user.university_prompt_dismissed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
