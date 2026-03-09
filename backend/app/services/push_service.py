import json
import logging
from datetime import datetime

from pywebpush import webpush, WebPushException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.push_subscription import PushSubscription
from app.models.user import User

logger = logging.getLogger(__name__)


def upsert_push_subscription(
    db: Session,
    user: User,
    endpoint: str,
    p256dh: str,
    auth: str,
) -> PushSubscription:
    existing = db.scalar(
        select(PushSubscription).where(
            PushSubscription.user_id == user.id,
            PushSubscription.endpoint == endpoint,
        )
    )
    if existing is None:
        existing = PushSubscription(
            user_id=user.id,
            endpoint=endpoint,
            p256dh=p256dh,
            auth=auth,
        )
        db.add(existing)
    else:
        existing.p256dh = p256dh
        existing.auth = auth

    db.commit()
    db.refresh(existing)
    return existing


def send_push_to_user(
    db: Session,
    user_id,
    *,
    title: str,
    body: str,
    url: str = "/rondas",
) -> int:
    settings = get_settings()
    if not settings.vapid_private_key or not settings.vapid_public_key:
        logger.warning("Push skipped because VAPID keys are missing")
        return 0

    subscriptions = list(
        db.scalars(select(PushSubscription).where(PushSubscription.user_id == user_id)).all()
    )
    if not subscriptions:
        return 0

    payload = json.dumps(
        {
            "title": title,
            "body": body,
            "url": url,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )

    sent = 0
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth,
                    },
                },
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
            )
            sent += 1
        except WebPushException as exc:
            logger.warning("Push failed for subscription=%s error=%s", sub.id, exc)
            if exc.response is not None and exc.response.status_code in {404, 410}:
                db.delete(sub)

    db.commit()
    return sent
