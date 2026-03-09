import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TurnStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    skipped = "skipped"
    reassigned = "reassigned"


class Turn(Base):
    __tablename__ = "turns"
    __table_args__ = (UniqueConstraint("round_id", "turn_index", name="uq_round_turn_index"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rounds.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    turn_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    turn_index: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[TurnStatus] = mapped_column(
        Enum(TurnStatus, name="turn_status"),
        nullable=False,
        default=TurnStatus.pending,
    )
    excuse: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    round = relationship("Round", back_populates="turns")
    user = relationship("User", back_populates="turns")
