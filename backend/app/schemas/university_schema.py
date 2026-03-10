from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UniversityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    country_code: str
    city: str | None = None
    created_at: datetime


class UniversitySearchResponse(BaseModel):
    items: list[UniversityResponse]


class CreateUniversityRequest(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    country_code: str = Field(default="AR", min_length=2, max_length=2)
    city: str | None = Field(default=None, max_length=120)


class CreateUniversityResponse(BaseModel):
    created: bool
    university: UniversityResponse | None = None
    possible_duplicates: list[UniversityResponse] = Field(default_factory=list)


class AdminRenameUniversityRequest(BaseModel):
    name: str = Field(min_length=3, max_length=255)


class AdminMergeUniversityRequest(BaseModel):
    target_university_id: UUID
