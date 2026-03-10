from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.university_schema import (
    CreateUniversityRequest,
    CreateUniversityResponse,
    UniversityResponse,
    UniversitySearchResponse,
)
from app.services.university_service import create_university, search_universities


router = APIRouter(prefix="/universities", tags=["universities"])


@router.get("/search", response_model=UniversitySearchResponse)
def search_universities_endpoint(
    q: str = Query(min_length=2),
    country: str = Query(default="AR", min_length=2, max_length=2),
    limit: int = Query(default=10, ge=1, le=10),
    db: Session = Depends(get_db),
) -> UniversitySearchResponse:
    items = search_universities(db, q, country, limit)
    return UniversitySearchResponse(items=[UniversityResponse.model_validate(item) for item in items])


@router.post("", response_model=CreateUniversityResponse)
def create_university_endpoint(
    payload: CreateUniversityRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CreateUniversityResponse:
    university, possible_duplicates, created = create_university(
        db=db,
        name=payload.name,
        country_code=payload.country_code,
        city=payload.city,
        created_by_user_id=user.id,
    )

    return CreateUniversityResponse(
        created=created,
        university=UniversityResponse.model_validate(university) if university else None,
        possible_duplicates=[UniversityResponse.model_validate(item) for item in possible_duplicates],
    )
