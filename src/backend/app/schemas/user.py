import json
from datetime import date, datetime
from typing import Any, List, Literal, Optional, Union

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    gender: Optional[str] = "Male"
    dob: Optional[Union[date, datetime]] = None
    phone: int
    designation: Optional[str] = "Statistical Officer"
    department: Optional[str] = "Official Statistics"
    qualifications: Optional[List[str]] = Field(default_factory=list)
    experience: Optional[List[str]] = Field(default_factory=list)
    role: Optional[str] = "officer"

    @field_validator("qualifications", "experience", mode="before")
    @classmethod
    def parse_json_fields(cls, v: Any):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
                return [v]
            except Exception:
                return [v] if v.strip() else []
        elif isinstance(v, list):
            return v
        return []


class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[int] = None
    password: str


class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    enrolled_courses: Optional[List[int]] = Field(default_factory=list)

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UsernameCheckResponse(BaseModel):
    username: str
    exists: bool
    available: bool
    message: Optional[str] = None
