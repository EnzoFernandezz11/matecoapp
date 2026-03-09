"""harden penalties schema

Revision ID: 0004_penalties_hardening
Revises: 7e6b099b8eed
Create Date: 2026-03-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004_penalties_hardening"
down_revision = "7e6b099b8eed"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("penalties", sa.Column("turn_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("penalties", sa.Column("description", sa.String(length=255), nullable=True))
    op.add_column(
        "penalties",
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_foreign_key(
        "fk_penalties_turn_id_turns",
        "penalties",
        "turns",
        ["turn_id"],
        ["id"],
    )
    op.create_index(
        "uq_penalties_turn_id_not_null",
        "penalties",
        ["turn_id"],
        unique=True,
        postgresql_where=sa.text("turn_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_penalties_turn_id_not_null", table_name="penalties")
    op.drop_constraint("fk_penalties_turn_id_turns", "penalties", type_="foreignkey")
    op.drop_column("penalties", "resolved")
    op.drop_column("penalties", "description")
    op.drop_column("penalties", "turn_id")
