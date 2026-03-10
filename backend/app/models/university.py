import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class UniversityStatus(str, enum.Enum):
    active = "active"
    pending_review = "pending_review"
    merged = "merged"
    deleted = "deleted"


class University(Base):
    __tablename__ = "universities"
    __table_args__ = (
        UniqueConstraint(
            "normalized_name",
            "country_code",
            "city",
            name="uq_universities_normalized_name_country_city",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True, default="AR")
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[UniversityStatus] = mapped_column(
        Enum(UniversityStatus, name="university_status"),
        nullable=False,
        default=UniversityStatus.active,
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    merged_into_university_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("universities.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    aliases = relationship("UniversityAlias", back_populates="university", cascade="all, delete-orphan")
    users = relationship(
        "User",
        back_populates="university_ref",
        foreign_keys="User.university_id",
    )


class UniversityAlias(Base):
    __tablename__ = "university_aliases"
    __table_args__ = (
        UniqueConstraint("university_id", "normalized_alias", name="uq_university_aliases_normalized_alias"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    university_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("universities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    alias: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_alias: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="seed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    university = relationship("University", back_populates="aliases")
