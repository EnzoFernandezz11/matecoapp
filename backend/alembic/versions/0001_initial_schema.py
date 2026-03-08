"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-03-07
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


penalty_mode = postgresql.ENUM("auto", "vote", name="penalty_mode", create_type=False)
turn_status = postgresql.ENUM("pending", "completed", "missed", name="turn_status", create_type=False)
penalty_type = postgresql.ENUM(
    "double_turn",
    "bring_facturas",
    "bring_bizcochos",
    name="penalty_type",
    create_type=False,
)


def upgrade() -> None:
    penalty_mode.create(op.get_bind(), checkfirst=True)
    turn_status.create(op.get_bind(), checkfirst=True)
    penalty_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("google_id", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=False),
        sa.Column("university", sa.String(length=255), nullable=True),
        sa.Column("career", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    op.create_table(
        "rounds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("invite_code", sa.String(length=12), nullable=False),
        sa.Column("penalty_mode", penalty_mode, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_rounds_invite_code", "rounds", ["invite_code"], unique=True)

    op.create_table(
        "round_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("round_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rounds.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("round_id", "user_id", name="uq_round_member"),
    )

    op.create_table(
        "turns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("round_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rounds.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("turn_index", sa.Integer(), nullable=False),
        sa.Column("status", turn_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("round_id", "turn_index", name="uq_round_turn_index"),
    )

    op.create_table(
        "penalties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("round_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rounds.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", penalty_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("penalties")
    op.drop_table("turns")
    op.drop_table("round_members")
    op.drop_index("ix_rounds_invite_code", table_name="rounds")
    op.drop_table("rounds")
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    penalty_type.drop(op.get_bind(), checkfirst=True)
    turn_status.drop(op.get_bind(), checkfirst=True)
    penalty_mode.drop(op.get_bind(), checkfirst=True)
