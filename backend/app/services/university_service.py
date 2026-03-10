import re
import unicodedata

from fastapi import HTTPException, status
from sqlalchemy import Select, case, or_, select
from sqlalchemy.orm import Session

from app.models.university import University, UniversityAlias, UniversityStatus


def normalize_university_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower().strip()
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def _search_stmt(query: str, country_code: str, limit: int) -> Select[tuple[University]]:
    normalized = normalize_university_text(query)
    pattern = f"%{normalized}%"

    return (
        select(University)
        .outerjoin(UniversityAlias, UniversityAlias.university_id == University.id)
        .where(
            University.status == UniversityStatus.active,
            University.country_code == country_code,
            or_(
                University.normalized_name.ilike(pattern),
                UniversityAlias.normalized_alias.ilike(pattern),
            ),
        )
        .order_by(
            case((University.normalized_name.ilike(f"{normalized}%"), 0), else_=1),
            University.name.asc(),
        )
        .limit(limit)
    )


def search_universities(db: Session, query: str, country_code: str, limit: int = 10) -> list[University]:
    clean_query = query.strip()
    if len(clean_query) < 2:
        return []

    stmt = _search_stmt(clean_query, country_code.upper(), min(max(limit, 1), 10))
    # distinct by id while preserving order
    seen: set = set()
    result: list[University] = []
    for item in db.scalars(stmt).all():
        if item.id in seen:
            continue
        seen.add(item.id)
        result.append(item)
    return result


def create_university(
    db: Session,
    name: str,
    country_code: str,
    city: str | None,
    created_by_user_id,
) -> tuple[University | None, list[University], bool]:
    clean_name = name.strip()
    clean_city = city.strip() if city else None
    normalized_name = normalize_university_text(clean_name)
    if not normalized_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid university name")

    normalized_country = country_code.strip().upper()
    if len(normalized_country) != 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid country code")

    existing_exact = db.scalar(
        select(University).where(
            University.normalized_name == normalized_name,
            University.country_code == normalized_country,
            University.city == clean_city,
            University.status != UniversityStatus.deleted,
        )
    )
    if existing_exact is not None:
        return existing_exact, [], False

    possible_duplicates = search_universities(db, clean_name, normalized_country, limit=5)
    if possible_duplicates:
        return None, possible_duplicates, False

    university = University(
        name=clean_name,
        normalized_name=normalized_name,
        country_code=normalized_country,
        city=clean_city,
        status=UniversityStatus.pending_review,
        created_by_user_id=created_by_user_id,
    )
    db.add(university)
    db.flush()

    db.add(
        UniversityAlias(
            university_id=university.id,
            alias=clean_name,
            normalized_alias=normalized_name,
            source="user",
        )
    )
    db.commit()
    db.refresh(university)
    return university, [], True
