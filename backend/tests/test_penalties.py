import uuid
import sys
import types
import unittest
from types import SimpleNamespace

from app.models.penalty import PenaltyType
from app.models.push_subscription import PushSubscription  # noqa: F401
from app.models.round import PenaltyMode

fake_round_schema = types.ModuleType("app.schemas.round_schema")
fake_round_schema.PenaltyResponse = object
fake_round_schema.RankingEntry = object
fake_round_schema.RoundDetailResponse = object
fake_round_schema.TurnSummary = object
fake_round_schema.UpcomingTurnSummary = object
sys.modules.setdefault("app.schemas.round_schema", fake_round_schema)

from app.services.round_service import apply_missed_penalty


class ApplyMissedPenaltyTests(unittest.TestCase):
    def test_returns_existing_penalty_for_same_turn(self) -> None:
        existing = SimpleNamespace(id=uuid.uuid4(), type=PenaltyType.double_turn)
        db = SimpleNamespace(
            scalar=lambda *_args, **_kwargs: existing,
            add=lambda *_args, **_kwargs: None,
        )
        round_obj = SimpleNamespace(id=uuid.uuid4(), penalty_mode=PenaltyMode.auto)

        penalty = apply_missed_penalty(db, round_obj, uuid.uuid4(), uuid.uuid4(), "Excusa")

        self.assertIs(penalty, existing)

    def test_creates_penalty_when_none_exists(self) -> None:
        added: list[object] = []
        db = SimpleNamespace(
            scalar=lambda *_args, **_kwargs: None,
            add=lambda item: added.append(item),
        )
        round_obj = SimpleNamespace(id=uuid.uuid4(), penalty_mode=PenaltyMode.auto)
        user_id = uuid.uuid4()
        turn_id = uuid.uuid4()

        penalty = apply_missed_penalty(db, round_obj, user_id, turn_id, "Sin termo")

        self.assertIsNotNone(penalty)
        self.assertEqual(penalty.round_id, round_obj.id)
        self.assertEqual(penalty.user_id, user_id)
        self.assertEqual(penalty.turn_id, turn_id)
        self.assertEqual(penalty.type, PenaltyType.double_turn)
        self.assertEqual(penalty.description, "Sin termo")
        self.assertFalse(penalty.resolved)
        self.assertEqual(len(added), 1)

    def test_returns_none_when_penalty_mode_is_vote(self) -> None:
        db = SimpleNamespace(
            scalar=lambda *_args, **_kwargs: None,
            add=lambda *_args, **_kwargs: None,
        )
        round_obj = SimpleNamespace(id=uuid.uuid4(), penalty_mode=PenaltyMode.vote)

        penalty = apply_missed_penalty(db, round_obj, uuid.uuid4(), uuid.uuid4(), None)

        self.assertIsNone(penalty)


if __name__ == "__main__":
    unittest.main()
