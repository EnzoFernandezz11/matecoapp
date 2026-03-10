from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.vote_schema import PenaltyVoteResponse, SubmitVoteRequest
from app.services.vote_service import get_active_vote, get_latest_closed_vote, submit_vote

router = APIRouter(prefix="/votes", tags=["votes"])


@router.get("/active/{round_id}", response_model=PenaltyVoteResponse | None)
def get_active_round_vote(
    round_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> PenaltyVoteResponse | None:
    return get_active_vote(db, round_id, user.id)


@router.get("/results/{round_id}", response_model=PenaltyVoteResponse | None)
def get_latest_round_vote_results(
    round_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> PenaltyVoteResponse | None:
    return get_latest_closed_vote(db, round_id, user.id)


@router.post("/vote", response_model=PenaltyVoteResponse)
def submit_penalty_vote(
    request: SubmitVoteRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> PenaltyVoteResponse:
    return submit_vote(db, request.vote_id, user.id, request.penalty_option_id)
