import csv
import hashlib
import json
import os
import uuid
from datetime import datetime
from typing import List, Optional

from db import schema
from fastapi import HTTPException, status
from schemas.course import (
    CourseCompletionResponse,
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    ElevatedCompetencyItem,
    EnrolledCourseDetail,
)
from sqlalchemy.orm import Session


def get_course_by_id(db: Session, course_id: int) -> schema.Course:
    """
    Retrieve a course by its ID.
    Raises 404 if the course is not found.
    """
    try:
        c_id = int(course_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid course ID format.",
        )

    course = db.query(schema.Course).filter(schema.Course.id == c_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found.",
        )
    return course


def get_all_courses(
    db: Session, skip: int = 0, limit: int = 100
) -> List[schema.Course]:
    """
    Retrieve all courses with pagination.
    """
    return db.query(schema.Course).offset(skip).limit(limit).all()


def create_course(db: Session, course_in: CourseCreate) -> schema.Course:
    tags_str = ", ".join(course_in.tags) if course_in.tags else ""

    course_entry = schema.Course(
        name=course_in.name,
        image=course_in.image,
        by=course_in.by,
        duration=course_in.duration,
        difficulty_level=course_in.difficulty_level,
        tags=tags_str,
        course_description=course_in.course_description,
        enrollees=course_in.enrollees or 0,
    )
    db.add(course_entry)
    db.commit()
    db.refresh(course_entry)
    return course_entry


def seed_courses_from_csv(db: Session, csv_path: Optional[str] = None) -> int:
    if db.query(schema.Course).first() is not None:
        return 0

    if not csv_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        csv_path = os.path.join(base_dir, "data", "mock data.csv")

    if not os.path.exists(csv_path):
        return 0

    seeded_count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                c_id = int(row.get("id")) if row.get("id") else None
                duration_val = (
                    float(row.get("duration")) if row.get("duration") else None
                )
                enrollees_val = int(row.get("enrollees")) if row.get("enrollees") else 0

                course = schema.Course(
                    id=c_id,
                    image=row.get("image"),
                    name=row.get("name"),
                    by=row.get("by"),
                    duration=duration_val,
                    difficulty_level=row.get("difficulty_level"),
                    tags=row.get("tags"),
                    course_description=row.get("course_description"),
                    enrollees=enrollees_val,
                )
                db.add(course)
                seeded_count += 1
            except Exception:
                continue

    if seeded_count > 0:
        db.commit()
    return seeded_count


def enroll_user_in_course(
    db: Session, user_id: int, course_id: int
) -> schema.UserCourse:
    course = get_course_by_id(db=db, course_id=course_id)

    user = db.query(schema.User).filter(schema.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    existing_enrollment = (
        db.query(schema.UserCourse)
        .filter(
            schema.UserCourse.user_id == user_id,
            schema.UserCourse.course_id == course_id,
        )
        .first()
    )
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already enrolled in this course.",
        )

    enrollment = schema.UserCourse(user_id=user_id, course_id=course_id)
    db.add(enrollment)

    if course.enrollees is None:
        course.enrollees = 1
    else:
        course.enrollees += 1

    db.commit()
    db.refresh(enrollment)
    return enrollment


def unenroll_user_from_course(db: Session, user_id: int, course_id: int) -> bool:
    enrollment = (
        db.query(schema.UserCourse)
        .filter(
            schema.UserCourse.user_id == user_id,
            schema.UserCourse.course_id == course_id,
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not enrolled in this course.",
        )

    course = db.query(schema.Course).filter(schema.Course.id == course_id).first()
    if course and course.enrollees and course.enrollees > 0:
        course.enrollees -= 1

    db.delete(enrollment)
    db.commit()
    return True


def get_user_enrolled_courses(db: Session, user_id: int) -> List[schema.Course]:
    """
    Retrieves full details of all courses a user is enrolled in.
    """
    enrollments = (
        db.query(schema.UserCourse).filter(schema.UserCourse.user_id == user_id).all()
    )
    course_ids = [e.course_id for e in enrollments]
    if not course_ids:
        return []
    return db.query(schema.Course).filter(schema.Course.id.in_(course_ids)).all()


def get_user_enrolled_courses_with_progress(
    db: Session, user_id: int
) -> List[EnrolledCourseDetail]:
    """
    Retrieves full details and progress of all courses a user is enrolled in.
    """
    enrollments = (
        db.query(schema.UserCourse)
        .filter(schema.UserCourse.user_id == user_id)
        .order_by(schema.UserCourse.enrolled_at.desc())
        .all()
    )
    if not enrollments:
        return []

    course_ids = [e.course_id for e in enrollments]
    courses = db.query(schema.Course).filter(schema.Course.id.in_(course_ids)).all()
    course_map = {c.id: c for c in courses}

    details: List[EnrolledCourseDetail] = []
    for enr in enrollments:
        c = course_map.get(enr.course_id)
        if c:
            details.append(
                EnrolledCourseDetail(
                    course=CourseResponse.model_validate(c),
                    enrollment_id=enr.id,
                    enrolled_at=enr.enrolled_at,
                    progress=enr.progress or 0,
                    status=enr.status or "enrolled",
                    completed_at=enr.completed_at,
                    certificate_id=enr.certificate_id,
                    badge_name=enr.badge_name,
                )
            )
    return details


def update_course_progress(
    db: Session, user_id: int, course_id: int, progress: int
) -> EnrolledCourseDetail:
    """
    Updates the learning progress of an enrolled course. If progress hits 100%,
    it automatically triggers course completion and competency elevation.
    """
    enrollment = (
        db.query(schema.UserCourse)
        .filter(
            schema.UserCourse.user_id == user_id,
            schema.UserCourse.course_id == course_id,
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not enrolled in this course.",
        )

    clamped_progress = max(0, min(100, progress))

    if clamped_progress >= 100:
        complete_course_and_elevate_competencies(
            db=db, user_id=user_id, course_id=course_id
        )
        db.refresh(enrollment)
    else:
        enrollment.progress = clamped_progress
        if clamped_progress > 0 and enrollment.status == "enrolled":
            enrollment.status = "in_progress"
        db.commit()
        db.refresh(enrollment)

    course = db.query(schema.Course).filter(schema.Course.id == course_id).first()
    return EnrolledCourseDetail(
        course=CourseResponse.model_validate(course),
        enrollment_id=enrollment.id,
        enrolled_at=enrollment.enrolled_at,
        progress=enrollment.progress,
        status=enrollment.status,
        completed_at=enrollment.completed_at,
        certificate_id=enrollment.certificate_id,
        badge_name=enrollment.badge_name,
    )


def complete_course_and_elevate_competencies(
    db: Session, user_id: int, course_id: int
) -> CourseCompletionResponse:
    """
    Completes an enrolled course, generates a verifiable iGOT Karmayogi Certificate ID & Badge,
    and automatically upgrades the mapped competency levels in the officer's FRAC matrix.
    """
    from services.competencies import resolve_cadre_target_level

    enrollment = (
        db.query(schema.UserCourse)
        .filter(
            schema.UserCourse.user_id == user_id,
            schema.UserCourse.course_id == course_id,
        )
        .first()
    )
    if not enrollment:
        enrollment = enroll_user_in_course(db=db, user_id=user_id, course_id=course_id)

    course = get_course_by_id(db=db, course_id=course_id)
    user = db.query(schema.User).filter(schema.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    now = datetime.utcnow()
    if not enrollment.certificate_id:
        cert_hash = (
            hashlib.sha256(
                f"{user_id}:{course_id}:{now.isoformat()}:{uuid.uuid4().hex[:6]}".encode()
            )
            .hexdigest()[:8]
            .upper()
        )
        enrollment.certificate_id = f"iGOT-MOSPI-{now.year}-{cert_hash}"

    if not enrollment.badge_name:
        enrollment.badge_name = f"Verified Specialist: {course.name}"

    enrollment.progress = 100
    enrollment.status = "completed"
    enrollment.completed_at = now

    db.commit()
    db.refresh(enrollment)

    all_competencies = db.query(schema.Competency).all()
    mapped_comps: List[schema.Competency] = []

    for comp in all_competencies:
        c_ids = []
        if comp.mapped_course_ids:
            try:
                c_ids = (
                    json.loads(comp.mapped_course_ids)
                    if isinstance(comp.mapped_course_ids, str)
                    else comp.mapped_course_ids
                )
            except Exception:
                c_ids = []

        names = [
            n.strip().lower()
            for n in (comp.mapped_course_names or "").split(";")
            if n.strip()
        ]

        if course_id in c_ids or any(
            n in course.name.lower() or course.name.lower() in n for n in names
        ):
            mapped_comps.append(comp)
        elif comp.department == user.department:
            if comp.name.lower() in course.name.lower() or any(
                t.lower() in comp.name.lower()
                for t in (course.tags or "").split(",")
                if t.strip()
            ):
                mapped_comps.append(comp)

    if not mapped_comps:
        dept_comps = [c for c in all_competencies if c.department == user.department]
        if dept_comps:
            mapped_comps = dept_comps[:1]
        elif all_competencies:
            mapped_comps = all_competencies[:1]

    elevated_items: List[ElevatedCompetencyItem] = []

    for comp in mapped_comps:
        try:
            target_dict = (
                json.loads(comp.target_levels)
                if isinstance(comp.target_levels, str)
                else comp.target_levels
            )
        except Exception:
            target_dict = {}
        target_lvl = resolve_cadre_target_level(target_dict, user.designation)

        user_eval = (
            db.query(schema.UserCompetency)
            .filter(
                schema.UserCompetency.user_id == user_id,
                schema.UserCompetency.competency_id == comp.id,
            )
            .first()
        )

        if not user_eval:
            prev_lvl = 1
            new_lvl = min(5, prev_lvl + 1)
            status_text = (
                "Benchmark Achieved"
                if new_lvl >= target_lvl
                else "Skill Gap Identified"
            )
            user_eval = schema.UserCompetency(
                user_id=user_id,
                competency_id=comp.id,
                assessed_level=new_lvl,
                status=status_text,
                last_assessed_at=now,
            )
            db.add(user_eval)
        else:
            prev_lvl = user_eval.assessed_level
            new_lvl = min(5, prev_lvl + 1)
            status_text = (
                "Benchmark Achieved"
                if new_lvl >= target_lvl
                else "Skill Gap Identified"
            )
            user_eval.assessed_level = new_lvl
            user_eval.status = status_text
            user_eval.last_assessed_at = now

        elevated_items.append(
            ElevatedCompetencyItem(
                competency_id=comp.id,
                code=comp.code,
                name=comp.name,
                department=comp.department,
                previous_level=prev_lvl,
                new_level=new_lvl,
                target_level=target_lvl,
                status=status_text,
            )
        )

    db.commit()

    return CourseCompletionResponse(
        message=f"Course '{course.name}' marked as completed. Competency levels successfully elevated!",
        course_id=course.id,
        course_name=course.name,
        status="completed",
        progress=100,
        completed_at=enrollment.completed_at or now,
        certificate_id=enrollment.certificate_id or "",
        badge_name=enrollment.badge_name or "",
        elevated_competencies=elevated_items,
    )


def get_recommended_courses_for_user(db: Session, user: schema.User) -> dict:
    """
    Computes personalized course recommendations for an officer based on their
    FRAC Competency Matrix skill gaps, cadre designation, and department.
    """
    from services.competencies import (
        get_user_competency_matrix,
        seed_competencies_from_csv,
    )

    seed_courses_from_csv(db)
    seed_competencies_from_csv(db)

    matrix = get_user_competency_matrix(db, user)
    user_desig = (
        matrix.get("user_designation") or user.designation or "Statistical Officer"
    )
    user_dept = (
        matrix.get("user_department") or user.department or "Official Statistics"
    )

    enrolled_enrollments = (
        db.query(schema.UserCourse.course_id)
        .filter(schema.UserCourse.user_id == user.id)
        .all()
    )
    enrolled_ids = {r[0] for r in enrolled_enrollments}

    gap_items = [item for item in matrix.get("items", []) if item.get("gap", 0) > 0]
    gap_items.sort(key=lambda x: x.get("gap", 0), reverse=True)

    recommendations: List[dict] = []
    seen_course_ids = set()

    all_courses = db.query(schema.Course).all()
    course_by_id = {c.id: c for c in all_courses}

    priority_counter = 1

    for comp in gap_items:
        comp_name = comp.get("name")
        comp_code = comp.get("code")
        gap_val = comp.get("gap", 1)
        target_lvl = comp.get("target_level", 3)
        mapped_ids = comp.get("mapped_course_ids") or []

        for cid in mapped_ids:
            if (
                isinstance(cid, int)
                and cid in course_by_id
                and cid not in enrolled_ids
                and cid not in seen_course_ids
            ):
                course = course_by_id[cid]
                seen_course_ids.add(cid)
                match_score = max(70, 98 - (priority_counter - 1) * 3)
                reason = (
                    f"Targeted to bridge your Level {target_lvl} competency benchmark in "
                    f"'{comp_name}' for the {user_desig} cadre."
                )
                recommendations.append(
                    {
                        "course": CourseResponse.model_validate(course),
                        "reason": reason,
                        "targeted_competency": comp_name,
                        "targeted_competency_code": comp_code,
                        "gap_severity": gap_val,
                        "match_score": match_score,
                        "priority": priority_counter,
                    }
                )
                priority_counter += 1

        mapped_names = comp.get("mapped_course_names") or []
        for course in all_courses:
            if course.id in enrolled_ids or course.id in seen_course_ids:
                continue

            matches_name = any(
                m.lower() in course.name.lower() or course.name.lower() in m.lower()
                for m in mapped_names
                if m
            )
            matches_comp = comp_name.lower() in course.name.lower()

            if matches_name or matches_comp:
                seen_course_ids.add(course.id)
                match_score = max(65, 94 - (priority_counter - 1) * 3)
                reason = (
                    f"Identified as high-priority curriculum to resolve skill deficit in "
                    f"'{comp_name}' (Assessed Gap: Level {gap_val})."
                )
                recommendations.append(
                    {
                        "course": CourseResponse.model_validate(course),
                        "reason": reason,
                        "targeted_competency": comp_name,
                        "targeted_competency_code": comp_code,
                        "gap_severity": gap_val,
                        "match_score": match_score,
                        "priority": priority_counter,
                    }
                )
                priority_counter += 1

    if len(recommendations) < 6:
        for course in all_courses:
            if course.id in enrolled_ids or course.id in seen_course_ids:
                continue

            course_tags = course.tags or ""
            is_dept_rel = (
                user_dept.lower() in (course.course_description or "").lower()
                or user_dept.lower() in course_tags.lower()
                or (course.enrollees and course.enrollees > 100)
            )

            if is_dept_rel or len(recommendations) < 3:
                seen_course_ids.add(course.id)
                match_score = max(60, 85 - (priority_counter - 1) * 2)
                reason = f"Recommended for professional development and continuous upskilling in {user_dept}."
                recommendations.append(
                    {
                        "course": CourseResponse.model_validate(course),
                        "reason": reason,
                        "targeted_competency": "Domain Excellence & Upskilling",
                        "targeted_competency_code": "PROF_DEV",
                        "gap_severity": 0,
                        "match_score": match_score,
                        "priority": priority_counter,
                    }
                )
                priority_counter += 1
                if len(recommendations) >= 8:
                    break

    return {
        "total_recommendations": len(recommendations),
        "identified_gaps_count": len(gap_items),
        "officer_designation": user_desig,
        "officer_department": user_dept,
        "recommendations": recommendations,
    }
