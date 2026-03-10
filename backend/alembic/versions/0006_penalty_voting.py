"""penalty voting tables

Revision ID: 0006_penalty_voting
Revises: 0005_turns_push_notifications
Create Date: 2026-03-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0006_penalty_voting"
down_revision = "0005_turns_push_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "penalty_votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("round_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rounds.id"), nullable=False),
        sa.Column("failed_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("turn_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("turns.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "closed", name="penalty_vote_status"),
            nullable=False,
            server_default="active",
        ),
        sa.Column("winning_penalty", sa.String(length=255), nullable=True),
    )
    op.create_index("ix_penalty_votes_round_id", "penalty_votes", ["round_id"])
    op.create_index("ix_penalty_votes_status", "penalty_votes", ["status"])

    op.create_table(
        "penalty_vote_options",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("vote_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("penalty_votes.id"), nullable=False),
        sa.Column("penalty_name", sa.String(length=255), nullable=False),
        sa.Column("vote_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_penalty_vote_options_vote_id", "penalty_vote_options", ["vote_id"])

    op.create_table(
        "user_penalty_votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("vote_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("penalty_votes.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("penalty_option_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("penalty_vote_options.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("vote_id", "user_id", name="uq_user_penalty_vote"),
    )
    op.create_index("ix_user_penalty_votes_vote_id", "user_penalty_votes", ["vote_id"])


def downgrade() -> None:
    op.drop_table("user_penalty_votes")
    op.drop_table("penalty_vote_options")
    op.drop_table("penalty_votes")
    op.execute("DROP TYPE IF EXISTS penalty_vote_status")
