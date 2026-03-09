from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminStatsRecentUser(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    created_at: datetime


class AdminStatsResponse(BaseModel):
    total_users: int
    new_users_last_7_days: int
    total_rounds: int
    recent_users: list[AdminStatsRecentUser]


class AdminUserListItem(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    created_at: datetime
    mesas_joined: int


class AdminUsersListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int
    skip: int
    limit: int


class AdminUserRoundSummary(BaseModel):
    id: UUID
    name: str
    joined_at: datetime


class AdminUserDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    created_at: datetime
    mesas_joined: int
    rounds: list[AdminUserRoundSummary]
    turns_total: int
    turns_completed: int
    turns_missed: int


class AdminUpdateUserRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
