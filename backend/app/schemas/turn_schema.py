from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.penalty import PenaltyType
from app.models.turn import TurnStatus


class MissTurnRequest(BaseModel):
    excuse: str | None = None


class TurnResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    round_id: UUID
    user_id: UUID
    turn_date: date
    turn_index: int
    status: TurnStatus
    excuse: str | None = None
    created_at: datetime


class TurnActionResponse(BaseModel):
    turn: TurnResponse
    next_turn: TurnResponse | None
    penalty: PenaltyType | None = None
