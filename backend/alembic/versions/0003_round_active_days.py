"""add active days to rounds

Revision ID: 0003_round_active_days
Revises: 0002_auth_email_password_support
Create Date: 2026-03-07
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0003_round_active_days"
down_revision = "0002_auth_email_password_support"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "rounds",
        sa.Column(
            "active_days",
            postgresql.ARRAY(sa.Integer()),
            nullable=False,
            server_default=sa.text("'{0,1,2,3,4,5,6}'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("rounds", "active_days")
