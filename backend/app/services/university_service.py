import re
import unicodedata
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.university import University
from app.models.user import User


def normalize_university_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower().strip()
    normalized = re.sub(r"\s+", " ", normalized)
    normalized = re.sub(r"[^a-z0-9 ]", "", normalized)
    return normalized


def _search_query() -> Select[tuple[University]]:
    return select(University).where(University.is_active.is_(True))


def search_universities(db: Session, query: str, limit: int = 8) -> list[University]:
    clean_query = query.strip()
    if len(clean_query) < 2:
        return []

    normalized_query = normalize_university_name(clean_query)
    stmt = (
        _search_query()
        .where(
            or_(
                University.name.ilike(f"%{clean_query}%"),
                University.normalized_name.like(f"%{normalized_query}%"),
            )
        )
        .order_by(University.is_verified.desc(), University.name.asc())
        .limit(max(1, min(limit, 20)))
    )
    return list(db.scalars(stmt).all())


def get_university_or_404(db: Session, university_id: UUID) -> University:
    university = db.scalar(_search_query().where(University.id == university_id))
    if university is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    return university


def create_or_get_university(
    db: Session,
    name: str,
    user: User,
    country: str | None = None,
    city: str | None = None,
) -> University:
    clean_name = name.strip()
    normalized_name = normalize_university_name(clean_name)
    if len(normalized_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University name must have at least 2 valid characters",
        )

    existing = db.scalar(select(University).where(University.normalized_name == normalized_name))
    if existing is not None:
        return existing

    university = University(
        name=clean_name,
        normalized_name=normalized_name,
        country=country.strip() if country else None,
        city=city.strip() if city else None,
        created_by_user_id=user.id,
    )
    db.add(university)
    db.commit()
    db.refresh(university)
    return university
