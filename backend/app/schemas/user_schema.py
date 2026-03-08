from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UniversityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    country: str | None = None
    city: str | None = None
    is_verified: bool


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    avatar_url: str
    university_id: UUID | None = None
    university: str | None = None
    university_ref: UniversityResponse | None = None
    career: str | None = None
    created_at: datetime


class GoogleAuthRequest(BaseModel):
    id_token: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class UpdateUserProfileRequest(BaseModel):
    university_id: UUID | None = None
