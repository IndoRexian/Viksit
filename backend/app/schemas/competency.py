from datetime import datetime
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field


class CompetencyBase(BaseModel):
    id: int
    code: str
    name: str
    department: str
    category: str
    description: Optional[str] = None
    target_levels: Union[Dict[str, int], str] = {}
    mapped_course_ids: Union[List[int], str] = []
    mapped_course_names: Optional[str] = None

    class Config:
        from_attributes = True


class CompetencyItemResponse(BaseModel):
    id: int
    code: str
    name: str
    department: str
    category: str
    description: Optional[str] = None
    target_level: int = 3
    target_levels: Dict[str, int] = {}
    assessed_level: int = 1
    status: str = "Benchmark Achieved"
    gap: int = 0
    mapped_course_ids: List[int] = []
    mapped_course_names: List[str] = []
    last_assessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DivisionSummary(BaseModel):
    division: str
    total_competencies: int
    achieved_count: int
    gap_count: int
    urgent_gap_count: int
    average_fulfillment_pct: float
    items: List[CompetencyItemResponse] = []

    class Config:
        from_attributes = True


class CompetencyMatrixResponse(BaseModel):
    composite_skill_index: float
    total_competencies: int
    achieved_count: int
    gap_count: int
    urgent_gap_count: int = 0
    user_designation: str
    user_department: str
    items: List[CompetencyItemResponse]
    division_summaries: List[DivisionSummary] = []


class AssessmentUpdate(BaseModel):
    competency_id: int
    assessed_level: int = Field(..., ge=1, le=5)
