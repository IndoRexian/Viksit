from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from schemas.competency import CompetencyItemResponse
from schemas.course import CourseResponse, EnrolledCourseDetail
from schemas.user import UserResponse


class DivisionalReadinessItem(BaseModel):
    division: str
    total_officers: int
    average_skill_index: float
    total_competencies: int
    achieved_benchmarks: int
    active_gaps: int
    urgent_gaps: int
    completion_rate: float


class CadreStatItem(BaseModel):
    cadre_group: str
    officer_count: int
    average_skill_index: float
    urgent_gaps_count: int


class AdminSummaryResponse(BaseModel):
    total_officers: int
    total_courses: int
    total_enrollments: int
    total_completions: int
    completion_rate: float
    ministry_skill_index: float
    active_gaps_count: int
    urgent_gaps_count: int
    total_certifications_issued: int
    divisional_readiness: List[DivisionalReadinessItem]
    cadre_distribution: List[CadreStatItem]


class OfficerCadreItem(BaseModel):
    id: int
    username: str
    name: str
    gender: Optional[str] = "Other"
    cadre_type: str
    designation: str
    department: str
    composite_skill_index: float
    achieved_count: int
    gap_count: int
    urgent_gap_count: int
    enrolled_count: int
    completed_count: int
    role: str = "officer"
    created_at: Optional[datetime] = None


class OfficerDrilldownResponse(BaseModel):
    officer: UserResponse
    cadre_type: str
    composite_skill_index: float
    achieved_count: int
    gap_count: int
    urgent_gap_count: int
    competencies: List[CompetencyItemResponse]
    enrolled_courses: List[EnrolledCourseDetail]
    badges_earned: List[Dict] = []


class AdminCompetencyOverrideRequest(BaseModel):
    competency_id: int
    assessed_level: int = Field(..., ge=1, le=5)
    remarks: Optional[str] = "Manual accreditation override by Training Authority"


class AdminCourseCreateOrUpdate(BaseModel):
    name: str
    by: Optional[str] = None
    duration: Optional[float] = None
    difficulty_level: Optional[str] = "Beginner"
    tags: Optional[List[str]] = []
    course_description: Optional[str] = None
    mapped_competency_ids: Optional[List[int]] = []


class AdminCertificationItem(BaseModel):
    certificate_id: str
    user_id: int
    user_name: str
    user_designation: str
    user_department: str
    course_id: int
    course_name: str
    badge_name: str
    completed_at: datetime
