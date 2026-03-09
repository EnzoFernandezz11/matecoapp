from datetime import datetime
import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.round import Round
from app.models.turn import TurnStatus
from app.services.push_service import send_push_to_user
from app.services.round_service import ensure_turns_scheduled, get_effective_turn_for_round_date

logger = logging.getLogger(__name__)


def send_daily_turn_notifications(db: Session) -> int:
    today = datetime.now().date()
    rounds = list(db.scalars(select(Round)).all())
    sent = 0
    for round_obj in rounds:
        if today.weekday() not in set(round_obj.active_days):
            continue
        ensure_turns_scheduled(db, round_obj, today)
        turn = get_effective_turn_for_round_date(round_obj, today)
        if turn is None:
            continue
        if turn.status not in {TurnStatus.pending, TurnStatus.reassigned}:
            continue
        sent += send_push_to_user(
            db,
            turn.user_id,
            title="Te toca llevar el mate 🧉",
            body=f"Hoy es tu turno en {round_obj.name}. Confirmalo en la app.",
            url=f"/rondas/{round_obj.id}/mesa",
        )
    db.commit()
    logger.info("Daily turn notifications sent=%s", sent)
    return sent
