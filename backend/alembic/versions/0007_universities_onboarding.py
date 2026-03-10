"""universities onboarding and search support

Revision ID: 0007_universities_onboarding
Revises: 0006_penalty_voting
Create Date: 2026-03-10
"""

from __future__ import annotations

import re
import unicodedata
import uuid
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect


revision = "0007_universities_onboarding"
down_revision = "0006_penalty_voting"
branch_labels = None
depends_on = None


def _normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower().strip()
    normalized = re.sub(r"[^a-z0-9\\s]", " ", normalized)
    normalized = re.sub(r"\\s+", " ", normalized)
    return normalized


def _column_exists(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _index_exists(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _fk_exists(inspector: sa.Inspector, table_name: str, fk_name: str) -> bool:
    return any(fk["name"] == fk_name for fk in inspector.get_foreign_keys(table_name))


def _unique_constraint_exists(inspector: sa.Inspector, table_name: str, constraint_name: str) -> bool:
    return any(constraint["name"] == constraint_name for constraint in inspector.get_unique_constraints(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    university_status_type = postgresql.ENUM("active", "pending_review", "merged", "deleted", name="university_status")
    university_status_type.create(bind, checkfirst=True)
    university_status_enum = postgresql.ENUM(
        "active",
        "pending_review",
        "merged",
        "deleted",
        name="university_status",
        create_type=False,
    )

    if not inspector.has_table("universities"):
        op.create_table(
            "universities",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("normalized_name", sa.String(length=255), nullable=False),
            sa.Column("country_code", sa.String(length=2), nullable=False, server_default="AR"),
            sa.Column("city", sa.String(length=120), nullable=True),
            sa.Column(
                "status",
                university_status_enum,
                nullable=False,
                server_default="active",
            ),
            sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
            sa.Column(
                "merged_into_university_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("universities.id"),
                nullable=True,
            ),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.UniqueConstraint(
                "normalized_name",
                "country_code",
                "city",
                name="uq_universities_normalized_name_country_city",
            ),
        )
    else:
        if not _column_exists(inspector, "universities", "normalized_name"):
            op.add_column("universities", sa.Column("normalized_name", sa.String(length=255), nullable=True))
        if not _column_exists(inspector, "universities", "country_code"):
            op.add_column(
                "universities",
                sa.Column("country_code", sa.String(length=2), nullable=False, server_default="AR"),
            )
        if not _column_exists(inspector, "universities", "city"):
            op.add_column("universities", sa.Column("city", sa.String(length=120), nullable=True))
        if not _column_exists(inspector, "universities", "status"):
            op.add_column(
                "universities",
                sa.Column("status", university_status_enum, nullable=False, server_default="active"),
            )
        if not _column_exists(inspector, "universities", "created_by_user_id"):
            op.add_column("universities", sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True))
        if not _column_exists(inspector, "universities", "merged_into_university_id"):
            op.add_column(
                "universities",
                sa.Column("merged_into_university_id", postgresql.UUID(as_uuid=True), nullable=True),
            )
        if not _column_exists(inspector, "universities", "created_at"):
            op.add_column(
                "universities",
                sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            )
        if not _column_exists(inspector, "universities", "updated_at"):
            op.add_column(
                "universities",
                sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            )

    op.execute(
        "UPDATE universities SET normalized_name = lower(trim(name)) "
        "WHERE normalized_name IS NULL AND name IS NOT NULL"
    )
    op.execute("UPDATE universities SET country_code = 'AR' WHERE country_code IS NULL")
    op.execute("UPDATE universities SET status = 'active' WHERE status IS NULL")

    inspector = inspect(bind)
    if not _fk_exists(inspector, "universities", "fk_universities_created_by_user_id"):
        op.create_foreign_key(
            "fk_universities_created_by_user_id",
            "universities",
            "users",
            ["created_by_user_id"],
            ["id"],
        )
    if not _fk_exists(inspector, "universities", "fk_universities_merged_into_university_id"):
        op.create_foreign_key(
            "fk_universities_merged_into_university_id",
            "universities",
            "universities",
            ["merged_into_university_id"],
            ["id"],
        )
    if not _unique_constraint_exists(inspector, "universities", "uq_universities_normalized_name_country_city"):
        op.create_unique_constraint(
            "uq_universities_normalized_name_country_city",
            "universities",
            ["normalized_name", "country_code", "city"],
        )

    inspector = inspect(bind)
    if _column_exists(inspector, "universities", "normalized_name") and not _index_exists(inspector, "universities", "ix_universities_normalized_name"):
        op.create_index("ix_universities_normalized_name", "universities", ["normalized_name"])
    if _column_exists(inspector, "universities", "country_code") and not _index_exists(inspector, "universities", "ix_universities_country_code"):
        op.create_index("ix_universities_country_code", "universities", ["country_code"])

    if not inspector.has_table("university_aliases"):
        op.create_table(
            "university_aliases",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column(
                "university_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("universities.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("alias", sa.String(length=255), nullable=False),
            sa.Column("normalized_alias", sa.String(length=255), nullable=False),
            sa.Column("source", sa.String(length=20), nullable=False, server_default="seed"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.UniqueConstraint("university_id", "normalized_alias", name="uq_university_aliases_normalized_alias"),
        )
    else:
        if not _column_exists(inspector, "university_aliases", "university_id"):
            op.add_column("university_aliases", sa.Column("university_id", postgresql.UUID(as_uuid=True), nullable=False))
        if not _column_exists(inspector, "university_aliases", "normalized_alias"):
            op.add_column("university_aliases", sa.Column("normalized_alias", sa.String(length=255), nullable=True))
        if not _column_exists(inspector, "university_aliases", "source"):
            op.add_column(
                "university_aliases",
                sa.Column("source", sa.String(length=20), nullable=False, server_default="seed"),
            )
        if not _column_exists(inspector, "university_aliases", "created_at"):
            op.add_column(
                "university_aliases",
                sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            )

    op.execute(
        "UPDATE university_aliases SET normalized_alias = lower(trim(alias)) "
        "WHERE normalized_alias IS NULL AND alias IS NOT NULL"
    )

    inspector = inspect(bind)
    if not _fk_exists(inspector, "university_aliases", "fk_university_aliases_university_id"):
        op.create_foreign_key(
            "fk_university_aliases_university_id",
            "university_aliases",
            "universities",
            ["university_id"],
            ["id"],
            ondelete="CASCADE",
        )
    if not _unique_constraint_exists(inspector, "university_aliases", "uq_university_aliases_normalized_alias"):
        op.create_unique_constraint(
            "uq_university_aliases_normalized_alias",
            "university_aliases",
            ["university_id", "normalized_alias"],
        )

    inspector = inspect(bind)
    if not _index_exists(inspector, "university_aliases", "ix_university_aliases_university_id"):
        op.create_index("ix_university_aliases_university_id", "university_aliases", ["university_id"])
    if not _index_exists(inspector, "university_aliases", "ix_university_aliases_normalized_alias"):
        op.create_index("ix_university_aliases_normalized_alias", "university_aliases", ["normalized_alias"])

    if not _column_exists(inspector, "users", "university_id"):
        op.add_column("users", sa.Column("university_id", postgresql.UUID(as_uuid=True), nullable=True))
    if not _column_exists(inspector, "users", "university_prompt_dismissed_at"):
        op.add_column("users", sa.Column("university_prompt_dismissed_at", sa.DateTime(timezone=True), nullable=True))

    inspector = inspect(bind)
    if not _index_exists(inspector, "users", "ix_users_university_id"):
        op.create_index("ix_users_university_id", "users", ["university_id"])
    if not _fk_exists(inspector, "users", "fk_users_university_id"):
        op.create_foreign_key("fk_users_university_id", "users", "universities", ["university_id"], ["id"])

    universities_table = sa.table(
        "universities",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String(length=255)),
        sa.column("normalized_name", sa.String(length=255)),
        sa.column("country_code", sa.String(length=2)),
        sa.column("city", sa.String(length=120)),
        sa.column("status", sa.String(length=20)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )

    aliases_table = sa.table(
        "university_aliases",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("university_id", postgresql.UUID(as_uuid=True)),
        sa.column("alias", sa.String(length=255)),
        sa.column("normalized_alias", sa.String(length=255)),
        sa.column("source", sa.String(length=20)),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )

    now = datetime.now(timezone.utc)
    seeds: list[tuple[str, str | None, list[str]]] = [
        ("UBA", "Buenos Aires", ["UBA MED", "UBA DER", "UBA ECO", "UBA EXA", "UBA FADU", "UBA ING", "UBA PSI", "UBA SOC", "UBA FILO", "UBA AGR", "UBA VET", "UBA FYB", "UBA ODO"]),
        ("UNC", "Cordoba", ["UNC MED", "UNC FCEFYN", "UNC ECO", "UNC DER", "UNC PSI", "UNC FAUD", "UNC LEN", "UNC ART", "UNC FAMAF", "UNC QUI", "UNC AGR", "UNC FILO", "UNC ODO", "UNC SOC", "UNC COM"]),
        ("UNLP", "La Plata", ["UNLP ING", "UNLP MED", "UNLP EXA", "UNLP ECO", "UNLP INFO", "UNLP ARQ", "UNLP ART", "UNLP HUM", "UNLP JUR", "UNLP PER"]),
        ("UTN", "Buenos Aires", ["UTN FRBA", "UTN FRC", "UTN FRM", "UTN FRSF", "UTN FRT", "UTN FRLP"]),
        ("UNR", "Rosario", ["UNR MED", "UNR EXA", "UNR ECO", "UNR HUM", "UNR DER"]),
        ("UNCUYO", "Mendoza", ["UNCUYO MED", "UNCUYO ING", "UNCUYO ECO", "UNCUYO DER"]),
        ("UNMDP", None, []),
        ("UNL", None, []),
        ("UNT", None, []),
        ("UNS", None, []),
        ("UNNE", None, []),
        ("UNSAM", None, []),
        ("UNQ", None, []),
        ("UNLA", None, []),
        ("UNTREF", None, []),
        ("UNGS", None, []),
        ("UNRC", None, []),
        ("SIGLO 21", None, []),
        ("UCC", None, []),
        ("UCA", None, []),
        ("UADE", None, []),
        ("ITBA", None, []),
        ("AUSTRAL", None, []),
        ("UDESA", None, []),
        ("UTDT", None, []),
        ("UP", None, []),
        ("UAI", None, []),
        ("UBP", None, []),
        ("UM", None, []),
        ("USAL", None, []),
        ("UB", None, []),
        ("UFLO", None, []),
        ("UFASTA", None, []),
    ]

    seed_ids: dict[str, uuid.UUID] = {}
    for name, city, aliases in seeds:
        bind.execute(
            sa.text(
                """
                INSERT INTO universities (id, name, normalized_name, country_code, city, status, created_at, updated_at)
                VALUES (:id, :name, :normalized_name, :country_code, :city, :status, :created_at, :updated_at)
                ON CONFLICT (normalized_name, country_code, city) DO NOTHING
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "name": name,
                "normalized_name": _normalize(name),
                "country_code": "AR",
                "city": city,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
        )
        uni_id = bind.execute(
            sa.text(
                """
                SELECT id
                FROM universities
                WHERE normalized_name = :normalized_name
                  AND country_code = :country_code
                  AND city IS NOT DISTINCT FROM :city
                LIMIT 1
                """
            ),
            {"normalized_name": _normalize(name), "country_code": "AR", "city": city},
        ).scalar_one()
        seed_ids[name] = uni_id
        for alias in aliases:
            bind.execute(
                sa.text(
                    """
                    INSERT INTO university_aliases (id, university_id, alias, normalized_alias, source, created_at)
                    VALUES (:id, :university_id, :alias, :normalized_alias, :source, :created_at)
                    ON CONFLICT (university_id, normalized_alias) DO NOTHING
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "university_id": str(uni_id),
                    "alias": alias,
                    "normalized_alias": _normalize(alias),
                    "source": "seed",
                    "created_at": now,
                },
            )

    # Backfill from existing user free-text values.
    rows = bind.execute(sa.text("SELECT DISTINCT university FROM users WHERE university IS NOT NULL AND trim(university) <> ''")).fetchall()
    normalized_to_id: dict[str, uuid.UUID] = {_normalize(name): uni_id for name, uni_id in seed_ids.items()}

    for row in rows:
        text_name = row[0].strip()
        normalized = _normalize(text_name)
        uni_id = normalized_to_id.get(normalized)
        if uni_id is None:
            bind.execute(
                sa.text(
                    """
                    INSERT INTO universities (id, name, normalized_name, country_code, city, status, created_at, updated_at)
                    VALUES (:id, :name, :normalized_name, :country_code, :city, :status, :created_at, :updated_at)
                    ON CONFLICT (normalized_name, country_code, city) DO NOTHING
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "name": text_name,
                    "normalized_name": normalized,
                    "country_code": "AR",
                    "city": None,
                    "status": "pending_review",
                    "created_at": now,
                    "updated_at": now,
                },
            )
            uni_id = bind.execute(
                sa.text(
                    """
                    SELECT id
                    FROM universities
                    WHERE normalized_name = :normalized_name
                      AND country_code = :country_code
                      AND city IS NULL
                    LIMIT 1
                    """
                ),
                {"normalized_name": normalized, "country_code": "AR"},
            ).scalar_one()
            normalized_to_id[normalized] = uni_id
            bind.execute(
                sa.text(
                    """
                    INSERT INTO university_aliases (id, university_id, alias, normalized_alias, source, created_at)
                    VALUES (:id, :university_id, :alias, :normalized_alias, :source, :created_at)
                    ON CONFLICT (university_id, normalized_alias) DO NOTHING
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "university_id": str(uni_id),
                    "alias": text_name,
                    "normalized_alias": normalized,
                    "source": "user",
                    "created_at": now,
                },
            )
        bind.execute(
            sa.text(
                "UPDATE users SET university_id = :university_id WHERE university IS NOT NULL "
                "AND trim(university) <> '' AND lower(trim(university)) = lower(:text_name)"
            ),
            {"university_id": str(uni_id), "text_name": text_name},
        )


def downgrade() -> None:
    op.drop_constraint("fk_users_university_id", "users", type_="foreignkey")
    op.drop_index("ix_users_university_id", table_name="users")
    op.drop_column("users", "university_prompt_dismissed_at")
    op.drop_column("users", "university_id")

    op.drop_index("ix_university_aliases_normalized_alias", table_name="university_aliases")
    op.drop_index("ix_university_aliases_university_id", table_name="university_aliases")
    op.drop_table("university_aliases")

    op.drop_index("ix_universities_country_code", table_name="universities")
    op.drop_index("ix_universities_normalized_name", table_name="universities")
    op.drop_table("universities")

    op.execute("DROP TYPE IF EXISTS university_status")
