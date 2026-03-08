"""add universities and user university reference

Revision ID: 0004_universities_profile
Revises: 7e6b099b8eed
Create Date: 2026-03-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004_universities_profile"
down_revision = "7e6b099b8eed"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "universities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("normalized_name", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_universities_normalized_name", "universities", ["normalized_name"], unique=True)

    op.add_column("users", sa.Column("university_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_users_university_id", "users", "universities", ["university_id"], ["id"])
    op.create_index("ix_users_university_id", "users", ["university_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_university_id", table_name="users")
    op.drop_constraint("fk_users_university_id", "users", type_="foreignkey")
    op.drop_column("users", "university_id")

    op.drop_index("ix_universities_normalized_name", table_name="universities")
    op.drop_table("universities")
