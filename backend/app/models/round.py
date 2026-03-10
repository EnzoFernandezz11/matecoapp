import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PenaltyMode(str, enum.Enum):
    auto = "auto"
    vote = "vote"


class Round(Base):
    __tablename__ = "rounds"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    invite_code: Mapped[str] = mapped_column(String(12), unique=True, nullable=False, index=True)
    penalty_mode: Mapped[PenaltyMode] = mapped_column(
        Enum(PenaltyMode, name="penalty_mode"),
        nullable=False,
        default=PenaltyMode.auto,
    )
    active_days: Mapped[list[int]] = mapped_column(
        ARRAY(Integer),
        nullable=False,
        default=lambda: [0, 1, 2, 3, 4, 5, 6],
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    creator = relationship("User", back_populates="rounds_created")
    members = relationship("RoundMember", back_populates="round", cascade="all, delete-orphan")
    turns = relationship("Turn", back_populates="round", cascade="all, delete-orphan")
    penalties = relationship("Penalty", back_populates="round", cascade="all, delete-orphan")
    penalty_votes = relationship("PenaltyVote", back_populates="round", cascade="all, delete-orphan")
