from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.university_schema import UniversityCreateRequest, UniversitySearchResponse
from app.services.university_service import create_or_get_university, search_universities


router = APIRouter(prefix="/universities", tags=["universities"])


@router.get("/search", response_model=list[UniversitySearchResponse])
def search_universities_endpoint(
    q: str = Query(default="", min_length=0, max_length=255),
    limit: int = Query(default=8, ge=1, le=20),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[UniversitySearchResponse]:
    _ = user
    return search_universities(db, q, limit)


@router.post("", response_model=UniversitySearchResponse)
def create_university_endpoint(
    payload: UniversityCreateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> UniversitySearchResponse:
    return create_or_get_university(db, payload.name, user, payload.country, payload.city)
