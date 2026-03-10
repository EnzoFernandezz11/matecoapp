import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PenaltyVoteStatus(str, enum.Enum):
    active = "active"
    closed = "closed"


PENALTY_OPTIONS = [
    "Llevar facturas",
    "Llevar bizcochos",
    "Doble mate",
    "Llevar algo dulce",
    "Llevar algo salado",
]

DEFAULT_PENALTY = "Doble mate"


class PenaltyVote(Base):
    __tablename__ = "penalty_votes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rounds.id"), nullable=False)
    failed_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    turn_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("turns.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[PenaltyVoteStatus] = mapped_column(
        Enum(PenaltyVoteStatus, name="penalty_vote_status"),
        nullable=False,
        default=PenaltyVoteStatus.active,
    )
    winning_penalty: Mapped[str | None] = mapped_column(String(255), nullable=True)

    round = relationship("Round", back_populates="penalty_votes")
    failed_user = relationship("User", back_populates="penalty_votes")
    turn = relationship("Turn")
    options = relationship("PenaltyVoteOption", back_populates="vote", cascade="all, delete-orphan")
    user_votes = relationship("UserPenaltyVote", back_populates="vote", cascade="all, delete-orphan")


class PenaltyVoteOption(Base):
    __tablename__ = "penalty_vote_options"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("penalty_votes.id"), nullable=False)
    penalty_name: Mapped[str] = mapped_column(String(255), nullable=False)
    vote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    vote = relationship("PenaltyVote", back_populates="options")
    user_votes = relationship("UserPenaltyVote", back_populates="option", cascade="all, delete-orphan")


class UserPenaltyVote(Base):
    __tablename__ = "user_penalty_votes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("penalty_votes.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    penalty_option_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("penalty_vote_options.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    vote = relationship("PenaltyVote", back_populates="user_votes")
    user = relationship("User")
    option = relationship("PenaltyVoteOption", back_populates="user_votes")
