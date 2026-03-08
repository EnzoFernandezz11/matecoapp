from urllib.parse import urlencode

from fastapi import HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User


def _build_avatar_url(name: str, picture: str | None) -> str:
    if picture:
        return picture
    query = urlencode({"name": name})
    return f"https://ui-avatars.com/api/?{query}"


def verify_google_token(token_value: str) -> dict:
    settings = get_settings()
    try:
        payload = id_token.verify_oauth2_token(
            token_value,
            requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        ) from exc

    required_fields = {"sub", "email", "name"}
    if not required_fields.issubset(payload):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token missing required fields",
        )
    return payload


def authenticate_google_user(db: Session, token_value: str) -> tuple[str, User]:
    payload = verify_google_token(token_value)
    email = payload["email"].lower().strip()

    stmt = select(User).where(User.google_id == payload["sub"])
    user = db.scalar(stmt)
    if user is None:
        user = db.scalar(select(User).where(func.lower(User.email) == email))

    avatar_url = _build_avatar_url(payload["name"], payload.get("picture"))
    if user is None:
        user = User(
            name=payload["name"],
            email=email,
            google_id=payload["sub"],
            avatar_url=avatar_url,
        )
        db.add(user)
    else:
        user.name = payload["name"]
        user.email = email
        user.google_id = payload["sub"]
        user.avatar_url = avatar_url

    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return token, user


def register_email_user(db: Session, name: str, email: str, password: str) -> tuple[str, User]:
    clean_name = name.strip()
    if len(clean_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must have at least 2 characters",
        )

    normalized_email = email.lower().strip()
    existing_user = db.scalar(select(User).where(func.lower(User.email) == normalized_email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        name=clean_name,
        email=normalized_email,
        password_hash=hash_password(password),
        avatar_url=_build_avatar_url(clean_name, None),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return token, user


def authenticate_email_user(db: Session, email: str, password: str) -> tuple[str, User]:
    normalized_email = email.lower().strip()
    user = db.scalar(select(User).where(func.lower(User.email) == normalized_email))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    return token, user
