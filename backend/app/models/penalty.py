import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PenaltyType(str, enum.Enum):
    double_turn = "double_turn"
    bring_facturas = "bring_facturas"
    bring_bizcochos = "bring_bizcochos"


class Penalty(Base):
    __tablename__ = "penalties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rounds.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type: Mapped[PenaltyType] = mapped_column(
        Enum(PenaltyType, name="penalty_type"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    round = relationship("Round", back_populates="penalties")
    user = relationship("User", back_populates="penalties")
