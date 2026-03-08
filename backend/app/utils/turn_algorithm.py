from collections.abc import Sequence
from uuid import UUID


def get_next_member_index(current_index: int, total_members: int) -> int:
    if total_members <= 0:
        raise ValueError("total_members must be greater than zero")
    return (current_index + 1) % total_members


def get_member_by_turn_index(member_ids: Sequence[UUID], turn_index: int) -> UUID:
    if not member_ids:
        raise ValueError("At least one member is required")
    return member_ids[turn_index % len(member_ids)]
