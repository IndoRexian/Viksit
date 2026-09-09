import json
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_validator


class CourseBase(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=255, description="Course name / title"
    )
    image: Optional[str] = Field(
        None, description="Course banner or thumbnail image URL"
    )
    by: Optional[str] = Field(
        None, description="Author or offering organization/institution"
    )
    duration: Optional[float] = Field(None, description="Course duration in hours")
    difficulty_level: Optional[str] = Field(
        None, description="Difficulty level (e.g. Beginner, Intermediate, Advanced)"
    )
    tags: Optional[List[str]] = Field(
        default_factory=list, description="Associated skill or topic tags"
    )
    course_description: Optional[str] = Field(
        None, description="Detailed description of the course"
    )
    enrollees: Optional[int] = Field(0, description="Total count of enrolled learners")

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v: Any):
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                return []
            try:
                parsed = json.loads(v_stripped)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except Exception:
                pass
            return [tag.strip() for tag in v_stripped.split(",") if tag.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return []


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    by: Optional[str] = None
    duration: Optional[float] = None
    difficulty_level: Optional[str] = None
    tags: Optional[List[str]] = None
    course_description: Optional[str] = None
    enrollees: Optional[int] = None

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v: Any):
        if v is None:
            return None
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                return []
            try:
                parsed = json.loads(v_stripped)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except Exception:
                pass
            return [tag.strip() for tag in v_stripped.split(",") if tag.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return []


class CourseResponse(CourseBase):
    id: int

    class Config:
        from_attributes = True


class EnrollmentResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime
    message: Optional[str] = "Successfully enrolled in course."

    class Config:
        from_attributes = True


class RecommendedCourseItem(BaseModel):
    course: CourseResponse
    reason: str = Field(
        ...,
        description="Personalized rationale explaining why this course was recommended",
    )
    targeted_competency: Optional[str] = Field(
        None, description="The specific competency name this course addresses"
    )
    targeted_competency_code: Optional[str] = Field(
        None, description="The code of the targeted competency"
    )
    gap_severity: int = Field(
        0, description="The magnitude of the skill gap identified (target - assessed)"
    )
    match_score: int = Field(
        90,
        ge=1,
        le=100,
        description="Estimated recommendation match score (percentage)",
    )
    priority: int = Field(1, description="Priority ranking for the recommendation")


class CourseRecommendationsResponse(BaseModel):
    total_recommendations: int
    identified_gaps_count: int
    officer_designation: str
    officer_department: str
    recommendations: List[RecommendedCourseItem]


class CourseProgressUpdate(BaseModel):
    progress: int = Field(
        ..., ge=0, le=100, description="Course progress percentage (0-100)"
    )


class ElevatedCompetencyItem(BaseModel):
    competency_id: int
    code: str
    name: str
    department: str
    previous_level: int
    new_level: int
    target_level: int
    status: str


class CourseCompletionResponse(BaseModel):
    message: str
    course_id: int
    course_name: str
    status: str
    progress: int
    completed_at: datetime
    certificate_id: str
    badge_name: str
    elevated_competencies: List[ElevatedCompetencyItem] = []


class EnrolledCourseDetail(BaseModel):
    course: CourseResponse
    enrollment_id: int
    enrolled_at: datetime
    progress: int
    status: str
    completed_at: Optional[datetime] = None
    certificate_id: Optional[str] = None
    badge_name: Optional[str] = None

    class Config:
        from_attributes = True
