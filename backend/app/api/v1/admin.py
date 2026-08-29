from typing import List, Optional

from core.dependencies import get_current_admin
from db import schema
from db.init_db import get_db
from fastapi import APIRouter, Depends, Path, Query, status
from schemas.admin import (
    AdminCertificationItem,
    AdminCompetencyOverrideRequest,
    AdminCourseCreateOrUpdate,
    AdminSummaryResponse,
    OfficerCadreItem,
    OfficerDrilldownResponse,
)
from schemas.course import CourseResponse
from services import admin as admin_service
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    "/summary",
    response_model=AdminSummaryResponse,
    summary="Get MoSPI Ministry Executive Dashboard Summary & Macro Metrics",
)
def get_summary(
    db: Session = Depends(get_db),
    current_admin: schema.User = Depends(get_current_admin),
):
    return admin_service.get_admin_dashboard_summary(db=db)


@router.get(
    "/officers",
    response_model=List[OfficerCadreItem],
    summary="Get Cadre Officers Roster with Competency Indices and Gap Alerts",
)
def list_cadre_officers(
    search: Optional[str] = Query(
        None, description="Search by name, cadre, designation, or department"
    ),
    department: Optional[str] = Query(
        None, description="Filter by Division / Department"
    ),
    cadre: Optional[str] = Query(None, description="Filter by Cadre (ISS, SSS, DES)"),
    gap_filter: Optional[str] = Query(
        None,
        description="Filter by gap status (all, gaps_only, urgent_only, achieved_only)",
    ),
    db: Session = Depends(get_db),
    current_admin: schema.User = Depends(get_current_admin),
):
    return admin_service.get_cadre_officers_list(
        db=db,
        search=search,
        department=department,
        cadre=cadre,
        gap_filter=gap_filter,
    )


@router.get(
    "/officers/{id}",
    response_model=OfficerDrilldownResponse,
    summary="Get full officer profile drilldown, FRAC matrix, and learning history",
)
def get_officer_drilldown(
    id: int = Path(..., description="Officer ID"),
    db: Session = Depends(get_db),
    current_admin: schema.User = Depends(get_current_admin),
):
    return admin_service.get_officer_drilldown(db=db, user_id=id)


@router.post(
    "/officers/{id}/competencies",
    summary="Admin manual accreditation / competency level override",
)
def update_officer_competency(
    id: int = Path(..., description="Officer ID"),
    payload: AdminCompetencyOverrideRequest = ...,
    db: Session = Depends(get_db),
    current_admin: schema.User = Depends(get_current_admin),
):
    res = admin_service.admin_update_officer_competency(
        db=db,
        user_id=id,
        competency_id=payload.competency_id,
        new_level=payload.assessed_level,
        remarks=payload.remarks,
    )
    return {
        "message": f"Successfully updated competency assessment to Level {res.assessed_level}.",
        "competency_id": res.competency_id,
        "assessed_level": res.assessed_level,
        "status": res.status,
    }


@router.post(
    "/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new course and associate competencies",
)
def create_course(
    payload: AdminCourseCreateOrUpdate,
    db: Session = Depends(get_db),
    current_admin: schema.User = Depends(get_current_admin),
):
    return admin_service.admin_create_or_update_course(db=db, course_in=payload)


@router.put(
    "/courses/{id}",
    response_model=CourseResponse,
    summary="Update course metadata and mappings",
)
def update_course(
    id: int = Path(..., description="Course ID to update"),
    payload: AdminCourseCreateOrUpdate = ...,
    db: Session = Depends(get_db),
    current_admin: schema.User = Depends(get_current_admin),
):
    return admin_service.admin_create_or_update_course(
        db=db, course_in=payload, course_id=id
    )


@router.get(
    "/certifications",
    response_model=List[AdminCertificationItem],
    summary="Get verified digital credentials & certification registry",
)
def get_certifications_registry(
    search: Optional[str] = Query(
        None, description="Search by cert ID, officer name, or course title"
    ),
    db: Session = Depends(get_db),
    current_admin: schema.User = Depends(get_current_admin),
):
    return admin_service.get_certification_registry(db=db, search=search)
