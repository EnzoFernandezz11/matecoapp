from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.schemas.user_schema import UserResponse


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_user_profile(user=Depends(get_current_user)) -> UserResponse:
    return user
