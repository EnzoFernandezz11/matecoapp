from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PenaltyVoteOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    penalty_name: str
    vote_count: int


class PenaltyVoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    round_id: UUID
    failed_user_id: UUID
    failed_user_name: str
    turn_id: UUID | None = None
    created_at: datetime
    expires_at: datetime
    status: str
    winning_penalty: str | None = None
    options: list[PenaltyVoteOptionResponse]
    user_has_voted: bool = False


class CreateVoteRequest(BaseModel):
    round_id: UUID
    failed_user_id: UUID


class SubmitVoteRequest(BaseModel):
    vote_id: UUID
    penalty_option_id: UUID
