"""turn date, status updates and push subscriptions

Revision ID: 0005_turns_push_notifications
Revises: 0004_penalties_hardening
Create Date: 2026-03-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0005_turns_push_notifications"
down_revision = "0004_penalties_hardening"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE turn_status RENAME VALUE 'completed' TO 'confirmed'")
    op.execute("ALTER TYPE turn_status RENAME VALUE 'missed' TO 'skipped'")
    op.execute("ALTER TYPE turn_status ADD VALUE IF NOT EXISTS 'reassigned'")

    op.add_column("turns", sa.Column("turn_date", sa.Date(), nullable=True))
    op.execute("UPDATE turns SET turn_date = (created_at AT TIME ZONE 'UTC')::date WHERE turn_date IS NULL")
    op.alter_column("turns", "turn_date", nullable=False)
    op.create_index("ix_turns_turn_date", "turns", ["turn_date"], unique=False)

    op.create_table(
        "push_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("endpoint", sa.String(length=1024), nullable=False),
        sa.Column("p256dh", sa.String(length=1024), nullable=False),
        sa.Column("auth", sa.String(length=1024), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "endpoint", name="uq_push_subscription_user_endpoint"),
    )
    op.create_index("ix_push_subscriptions_user_id", "push_subscriptions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_push_subscriptions_user_id", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
    op.drop_index("ix_turns_turn_date", table_name="turns")
    op.drop_column("turns", "turn_date")

    op.execute("ALTER TYPE turn_status RENAME VALUE 'confirmed' TO 'completed'")
    op.execute("ALTER TYPE turn_status RENAME VALUE 'skipped' TO 'missed'")
