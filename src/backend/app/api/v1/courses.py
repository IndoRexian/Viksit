from typing import List

from core.dependencies import get_current_user
from db import schema
from db.init_db import get_db
from fastapi import APIRouter, Depends, Path, Query, status
from schemas.course import (
    CourseCompletionResponse,
    CourseProgressUpdate,
    CourseRecommendationsResponse,
    CourseResponse,
    EnrolledCourseDetail,
    EnrollmentResponse,
)
from services import courses as course_service
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    "/recommendations",
    response_model=CourseRecommendationsResponse,
    summary="Get personalized course recommendations for the authenticated officer",
)
def get_recommended_courses(
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Computes personalized course recommendations for the authenticated officer based
    on their FRAC Competency Matrix skill gaps, cadre designation, and department.
    """
    return course_service.get_recommended_courses_for_user(db=db, user=current_user)


@router.post(
    "/{id}/enroll",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enroll authenticated user in a course",
)
def enroll_in_course(
    id: int = Path(
        ..., description="The unique ID of the course to enroll in", examples=[1]
    ),
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Enroll the currently authenticated user in the course specified by `id`.
    """
    enrollment = course_service.enroll_user_in_course(
        db=db, user_id=current_user.id, course_id=id
    )
    return EnrollmentResponse(
        id=enrollment.id,
        user_id=enrollment.user_id,
        course_id=enrollment.course_id,
        enrolled_at=enrollment.enrolled_at,
        message="Successfully enrolled in course.",
    )


@router.post(
    "/{id}/progress",
    response_model=EnrolledCourseDetail,
    summary="Update course learning progress (0-100%)",
)
def update_course_progress(
    id: int = Path(..., description="The course ID"),
    payload: CourseProgressUpdate = ...,
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Updates the learning progress percentage for an enrolled course.
    If progress reaches 100%, automatically elevates mapped competencies.
    """
    return course_service.update_course_progress(
        db=db,
        user_id=current_user.id,
        course_id=id,
        progress=payload.progress,
    )


@router.post(
    "/{id}/complete",
    response_model=CourseCompletionResponse,
    summary="Mark enrolled course as completed and auto-elevate mapped competencies",
)
def complete_course(
    id: int = Path(..., description="The course ID to mark completed"),
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Marks the enrolled course as completed, generates an official verifiable
    iGOT Karmayogi digital certificate & badge, and automatically elevates
    the officer's mapped competency levels (e.g. L1 -> L2/L3).
    """
    return course_service.complete_course_and_elevate_competencies(
        db=db,
        user_id=current_user.id,
        course_id=id,
    )


@router.delete(
    "/{id}/enroll",
    summary="Unenroll authenticated user from a course",
)
def unenroll_from_course(
    id: int = Path(
        ..., description="The unique ID of the course to unenroll from", examples=[1]
    ),
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Unenroll the currently authenticated user from the course specified by `id`.
    """
    course_service.unenroll_user_from_course(
        db=db, user_id=current_user.id, course_id=id
    )
    return {"message": "Successfully unenrolled from course.", "course_id": id}


@router.get(
    "/user/my-courses",
    response_model=List[CourseResponse],
    summary="Get all courses enrolled by the authenticated user",
)
def get_my_enrolled_courses(
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Fetch the list of full course details for all courses enrolled by the currently authenticated user.
    """
    return course_service.get_user_enrolled_courses(db=db, user_id=current_user.id)


@router.get(
    "/user/enrolled-details",
    response_model=List[EnrolledCourseDetail],
    summary="Get all enrolled courses with progress, status, and certificates",
)
def get_my_enrolled_courses_details(
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """
    Fetch comprehensive enrollment status, learning progress, verified badges, and completion certificates.
    """
    return course_service.get_user_enrolled_courses_with_progress(
        db=db, user_id=current_user.id
    )


@router.get(
    "/{id}",
    response_model=CourseResponse,
    summary="Get course details by ID",
)
def get_course(
    id: int = Path(..., description="The unique ID of the course", examples=[1]),
    db: Session = Depends(get_db),
):
    """
    Fetch comprehensive information and metadata for a specific course by its unique ID.
    """
    return course_service.get_course_by_id(db=db, course_id=id)


@router.get(
    "/",
    response_model=List[CourseResponse],
    summary="List all courses",
)
def list_courses(
    skip: int = Query(
        0, ge=0, description="Number of courses to skip (for pagination)"
    ),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of courses to return"
    ),
    db: Session = Depends(get_db),
):
    """
    Retrieve a paginated list of all available courses in the database.
    """
    return course_service.get_all_courses(db=db, skip=skip, limit=limit)
