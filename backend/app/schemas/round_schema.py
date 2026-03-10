from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.penalty import PenaltyType
from app.models.round import PenaltyMode
from app.models.turn import TurnStatus
from app.schemas.user_schema import UserResponse


class RoundCreate(BaseModel):
    name: str
    penalty_mode: PenaltyMode
    active_days: list[int] = Field(min_length=1, max_length=7)

    @field_validator("active_days")
    @classmethod
    def validate_active_days(cls, value: list[int]) -> list[int]:
        unique_days = sorted(set(value))
        if len(unique_days) != len(value):
            raise ValueError("active_days cannot contain duplicates")
        if any(day < 0 or day > 6 for day in unique_days):
            raise ValueError("active_days values must be between 0 and 6")
        return unique_days


class RoundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_by: UUID
    invite_code: str
    penalty_mode: PenaltyMode
    active_days: list[int]
    created_at: datetime


class RoundMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user: UserResponse
    joined_at: datetime


class TurnSummary(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    turn_date: date | None = None
    turn_index: int
    status: TurnStatus
    excuse: str | None = None
    created_at: datetime


class UpcomingTurnSummary(BaseModel):
    id: UUID
    date: date
    user_id: UUID
    user_name: str
    status: TurnStatus


class PenaltyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    round_id: UUID
    user_id: UUID
    user_name: str
    turn_id: UUID | None = None
    type: PenaltyType
    description: str | None = None
    resolved: bool
    created_at: datetime


class RankingEntry(BaseModel):
    user: str
    mates: int
    missed: int = 0
    role: str | None = None


class InviteLinkResponse(BaseModel):
    invite_code: str
    invite_link: str


class JoinByCodeRequest(BaseModel):
    invite_code: str


from app.schemas.vote_schema import PenaltyVoteResponse


class RoundDetailResponse(BaseModel):
    round: RoundResponse
    members: list[RoundMemberResponse]
    current_turn: TurnSummary | None
    upcoming_turns: list[UpcomingTurnSummary]
    penalties: list[PenaltyResponse]
    ranking: list[RankingEntry]
    active_vote: PenaltyVoteResponse | None = None
    latest_vote_result: PenaltyVoteResponse | None = None
