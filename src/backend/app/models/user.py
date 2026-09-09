import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class User(BaseModel):
    """
    Pydantic Model for Users
    """

    user_id: uuid.UUID
    username: str
    created_at: datetime

    name: str
    gender: Literal["Male", "Female", "Other"]
    dob: datetime
    phone: int

    designation: str
    department: str
    qualifications: list[str]
    experience: list[str]

    email_hash: str

    password: str

    class Config:
        from_attributes = True
