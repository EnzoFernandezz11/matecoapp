from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.user_schema import UpdateUserProfileRequest, UserResponse
from app.services.university_service import get_university_or_404


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_user_profile(user=Depends(get_current_user)) -> UserResponse:
    return user


@router.patch("/me", response_model=UserResponse)
def update_user_profile(
    payload: UpdateUserProfileRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> UserResponse:
    if payload.university_id is None:
        user.university_id = None
        user.university = None
    else:
        university = get_university_or_404(db, payload.university_id)
        user.university_id = university.id
        user.university = university.name

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
