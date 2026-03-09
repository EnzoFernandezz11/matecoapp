from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.push_schema import PushSubscribeRequest, PushSubscribeResponse
from app.services.push_service import upsert_push_subscription


router = APIRouter(prefix="/api", tags=["push"])


@router.post("/push-subscribe", response_model=PushSubscribeResponse)
def push_subscribe(
    payload: PushSubscribeRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> PushSubscribeResponse:
    upsert_push_subscription(
        db,
        user,
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
    )
    return PushSubscribeResponse(subscribed=True)
