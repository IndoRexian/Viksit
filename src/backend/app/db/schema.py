from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(Text, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    gender: Mapped[Optional[str]] = mapped_column(Text, default="Other")
    dob: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    phone: Mapped[int] = mapped_column(Numeric, unique=True, index=True, nullable=False)

    designation: Mapped[Optional[str]] = mapped_column(
        Text, default="Statistical Officer"
    )
    department: Mapped[Optional[str]] = mapped_column(
        Text, default="Official Statistics"
    )
    qualifications: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    experience: Mapped[Optional[str]] = mapped_column(Text, default="[]")

    email_hash: Mapped[str] = mapped_column(
        Text, unique=True, index=True, nullable=False
    )
    password: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(Text, default="officer")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    enrollments: Mapped[List["UserCourse"]] = relationship(
        "UserCourse",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    competencies: Mapped[List["UserCompetency"]] = relationship(
        "UserCompetency",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def enrolled_courses(self) -> List[int]:
        return [e.course_id for e in self.enrollments] if self.enrollments else []


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    by: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    difficulty_level: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    course_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    enrollees: Mapped[Optional[int]] = mapped_column(
        BigInteger, default=0, nullable=True
    )

    enrollments: Mapped[List["UserCourse"]] = relationship(
        "UserCourse",
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class UserCourse(Base):
    __tablename__ = "user_courses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    progress: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="enrolled", nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    certificate_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    badge_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_user_course"),)

    user: Mapped["User"] = relationship("User", back_populates="enrollments")
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")


class Competency(Base):
    __tablename__ = "competencies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(Text, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    category: Mapped[str] = mapped_column(Text, default="Domain")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_levels: Mapped[str] = mapped_column(Text, default="{}")
    mapped_course_ids: Mapped[str] = mapped_column(Text, default="[]")
    mapped_course_names: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user_evaluations: Mapped[List["UserCompetency"]] = relationship(
        "UserCompetency",
        back_populates="competency",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class UserCompetency(Base):
    __tablename__ = "user_competencies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    competency_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("competencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assessed_level: Mapped[int] = mapped_column(BigInteger, default=1, nullable=False)
    last_assessed_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    status: Mapped[str] = mapped_column(Text, default="Pending")

    __table_args__ = (
        UniqueConstraint("user_id", "competency_id", name="uq_user_competency"),
    )

    user: Mapped["User"] = relationship("User", back_populates="competencies")
    competency: Mapped["Competency"] = relationship(
        "Competency", back_populates="user_evaluations"
    )
