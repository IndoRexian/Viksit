from typing import List, Optional, Union

from pydantic import BaseModel


class Course(BaseModel):
    """
    Pydantic Model for Courses
    """

    id: int
    image: Optional[str] = None
    name: str
    by: Optional[str] = None
    duration: Optional[float] = None
    difficulty_level: Optional[str] = None
    tags: Optional[Union[List[str], str]] = None
    course_description: Optional[str] = None
    enrollees: Optional[int] = 0

    class Config:
        from_attributes = True
