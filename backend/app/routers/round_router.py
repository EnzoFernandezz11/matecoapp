from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.round_schema import (
    InviteLinkResponse,
    JoinByCodeRequest,
    RoundCreate,
    RoundDetailResponse,
    RoundResponse,
)
from app.schemas.turn_schema import TurnResponse
from app.services.round_service import (
    build_invite_link,
    create_round,
    get_current_turn,
    get_round_detail,
    get_round_or_404,
    join_round_by_code,
    join_round,
    leave_round,
    list_user_rounds,
)


router = APIRouter(prefix="/rounds", tags=["rounds"])


@router.post("", response_model=RoundResponse)
def create_new_round(
    payload: RoundCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> RoundResponse:
    return create_round(db, user, payload.name, payload.penalty_mode, payload.active_days)


@router.get("", response_model=list[RoundResponse])
def list_rounds(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[RoundResponse]:
    return list_user_rounds(db, user.id)


@router.get("/{round_id}", response_model=RoundDetailResponse)
def get_round(
    round_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> RoundDetailResponse:
    return get_round_detail(db, round_id, user.id)


@router.post("/{round_id}/join", response_model=RoundResponse)
def join_existing_round(
    round_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> RoundResponse:
    return join_round(db, round_id, user)


@router.post("/join-by-code", response_model=RoundResponse)
def join_existing_round_by_code(
    payload: JoinByCodeRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> RoundResponse:
    return join_round_by_code(db, payload.invite_code, user)


@router.delete("/{round_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_existing_round(
    round_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Response:
    leave_round(db, round_id, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{round_id}/invite", response_model=InviteLinkResponse)
def invite_to_round(
    round_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> InviteLinkResponse:
    round_obj = get_round_or_404(db, round_id)
    return InviteLinkResponse(
        invite_code=round_obj.invite_code,
        invite_link=build_invite_link(round_obj),
    )


@router.get("/{round_id}/turn", response_model=TurnResponse)
def get_round_turn(
    round_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> TurnResponse:
    return get_current_turn(db, round_id, user.id)
