from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UniversitySearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    country: str | None = None
    city: str | None = None
    is_verified: bool
    created_at: datetime


class UniversityCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    country: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
