from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.user_schema import (
    AuthResponse,
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.services.auth_service import authenticate_email_user, authenticate_google_user, register_email_user


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=AuthResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    token, user = authenticate_google_user(db, payload.id_token)
    return AuthResponse(token=token, user=user)


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    token, user = register_email_user(db, payload.name, payload.email, payload.password)
    return AuthResponse(token=token, user=user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    token, user = authenticate_email_user(db, payload.email, payload.password)
    return AuthResponse(token=token, user=user)


@router.get("/me", response_model=UserResponse)
def get_me(user=Depends(get_current_user)) -> UserResponse:
    return user
