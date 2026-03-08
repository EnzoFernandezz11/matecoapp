"""seed argentina universities and faculties

Revision ID: 0005_seed_argentina_universities
Revises: 0004_universities_profile
Create Date: 2026-03-08
"""

import re
import unicodedata
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0005_seed_argentina_universities"
down_revision = "0004_universities_profile"
branch_labels = None
depends_on = None


UNIVERSITY_OPTIONS = [
    # UBA
    "UBA - MEDICINA",
    "UBA - DERECHO",
    "UBA - ECONOMICAS",
    "UBA - EXACTAS Y NATURALES",
    "UBA - FADU",
    "UBA - INGENIERIA",
    "UBA - PSICOLOGIA",
    "UBA - SOCIALES",
    "UBA - FILOSOFIA Y LETRAS",
    "UBA - AGRONOMIA",
    "UBA - VETERINARIA",
    "UBA - FARMACIA Y BIOQUIMICA",
    "UBA - ODONTOLOGIA",
    # UNC
    "UNC - MEDICAS",
    "UNC - FCEFYN",
    "UNC - ECONOMICAS",
    "UNC - DERECHO",
    "UNC - PSICOLOGIA",
    "UNC - FAUD",
    "UNC - LENGUAS",
    "UNC - ARTES",
    "UNC - FAMAF",
    "UNC - QUIMICAS",
    "UNC - AGROPECUARIAS",
    "UNC - FILOSOFIA Y HUMANIDADES",
    "UNC - ODONTOLOGIA",
    "UNC - SOCIALES",
    "UNC - COMUNICACION",
    # UNLP
    "UNLP - INGENIERIA",
    "UNLP - CIENCIAS MEDICAS",
    "UNLP - EXACTAS",
    "UNLP - ECONOMICAS",
    "UNLP - INFORMATICA",
    "UNLP - ARQUITECTURA Y URBANISMO",
    "UNLP - ARTES",
    "UNLP - HUMANIDADES Y CIENCIAS DE LA EDUCACION",
    "UNLP - CIENCIAS JURIDICAS Y SOCIALES",
    "UNLP - PERIODISMO Y COMUNICACION SOCIAL",
    # UTN
    "UTN - FRBA",
    "UTN - FRC",
    "UTN - FRM",
    "UTN - FRSF",
    "UTN - FRT",
    "UTN - FRLP",
    # UNR
    "UNR - CIENCIAS MEDICAS",
    "UNR - EXACTAS, INGENIERIA Y AGRIMENSURA",
    "UNR - ECONOMICAS Y ESTADISTICA",
    "UNR - HUMANIDADES Y ARTES",
    "UNR - DERECHO",
    # UNCUYO
    "UNCUYO - CIENCIAS MEDICAS",
    "UNCUYO - INGENIERIA",
    "UNCUYO - CIENCIAS ECONOMICAS",
    "UNCUYO - DERECHO",
    # Otras nacionales
    "UNMDP",
    "UNL",
    "UNT",
    "UNS",
    "UNNE",
    "UNSAM",
    "UNQ",
    "UNLA",
    "UNTREF",
    "UNGS",
    "UNRC",
    # Privadas
    "SIGLO 21",
    "UCC",
    "UCA",
    "UADE",
    "ITBA",
    "AUSTRAL",
    "UDESA",
    "UTDT",
    "UP",
    "UAI",
    "UBP",
    "UM",
    "USAL",
    "UB",
    "UFLO",
    "UFASTA",
]


def _normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower().strip()
    normalized = re.sub(r"[^a-z0-9 ]", "", normalized)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def upgrade() -> None:
    bind = op.get_bind()
    universities_table = sa.table(
        "universities",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("normalized_name", sa.String),
        sa.column("country", sa.String),
        sa.column("city", sa.String),
        sa.column("is_verified", sa.Boolean),
        sa.column("is_active", sa.Boolean),
    )

    for name in UNIVERSITY_OPTIONS:
        normalized_name = _normalize(name)
        exists_stmt = sa.text("SELECT 1 FROM universities WHERE normalized_name = :normalized_name LIMIT 1")
        exists = bind.execute(exists_stmt, {"normalized_name": normalized_name}).scalar()
        if exists:
            continue

        bind.execute(
            universities_table.insert().values(
                id=uuid.uuid4(),
                name=name,
                normalized_name=normalized_name,
                country="Argentina",
                city=None,
                is_verified=True,
                is_active=True,
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    for name in UNIVERSITY_OPTIONS:
        normalized_name = _normalize(name)
        bind.execute(
            sa.text("DELETE FROM universities WHERE normalized_name = :normalized_name"),
            {"normalized_name": normalized_name},
        )
