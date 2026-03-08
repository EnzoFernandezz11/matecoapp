"""add email/password auth support

Revision ID: 0002_auth_email_password_support
Revises: 0001_initial_schema
Create Date: 2026-03-07
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_auth_email_password_support"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.Text(), nullable=True))
    op.alter_column("users", "google_id", existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "google_id", existing_type=sa.String(length=255), nullable=False)
    op.drop_column("users", "password_hash")
