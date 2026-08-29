from typing import List

from core.dependencies import get_current_user
from db import schema
from db.init_db import get_db
from fastapi import APIRouter, Depends, Query, status
from schemas.competency import (
    AssessmentUpdate,
    CompetencyBase,
    CompetencyMatrixResponse,
)
from services import competencies as competency_service
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    "/matrix",
    response_model=CompetencyMatrixResponse,
    summary="Get the authenticated user's personalized FRAC Competency Matrix",
)
def get_user_matrix(
    scope: str = Query(
        "department",
        description="Scope of competencies: 'department' (current department) or 'all' (all MoSPI divisions)",
    ),
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Retrieves the complete FRAC Competency Matrix customized for the
    current user's department, cadre designation, and benchmark expectations.
    """
    return competency_service.get_user_competency_matrix(
        db=db, user=current_user, scope=scope
    )


@router.post(
    "/assess",
    summary="Update user's assessed score for a competency",
)
def update_assessment(
    data: AssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Updates the authenticated officer's evaluated level for a competency.
    """
    eval_record = competency_service.update_user_competency_score(
        db=db,
        user_id=current_user.id,
        competency_id=data.competency_id,
        new_level=data.assessed_level,
    )
    return {
        "message": "Assessment recorded successfully.",
        "competency_id": eval_record.competency_id,
        "assessed_level": eval_record.assessed_level,
        "status": eval_record.status,
    }


@router.get(
    "/all",
    response_model=List[CompetencyBase],
    summary="List all master competencies",
)
def list_all_competencies(
    db: Session = Depends(get_db),
    department: str = Query(None, description="Filter by department"),
):
    """
    Returns all master competencies, optionally filtered by department.
    """
    query = db.query(schema.Competency)
    if department:
        query = query.filter(schema.Competency.department == department)
    return query.all()
