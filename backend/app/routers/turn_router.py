from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.turn_schema import MissTurnRequest, TurnActionResponse
from app.services.turn_service import complete_turn, miss_turn


router = APIRouter(prefix="/turns", tags=["turns"])


@router.post("/{turn_id}/complete", response_model=TurnActionResponse)
def complete_round_turn(
    turn_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> TurnActionResponse:
    return complete_turn(db, turn_id, user.id)


@router.post("/{turn_id}/miss", response_model=TurnActionResponse)
def miss_round_turn(
    turn_id: UUID,
    request: MissTurnRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> TurnActionResponse:
    return miss_turn(db, turn_id, user.id, request.excuse)
