import json
import time
from datetime import datetime
from typing import Dict, List, Optional

from db import schema
from fastapi import HTTPException, status
from schemas.admin import (
    AdminCertificationItem,
    AdminCourseCreateOrUpdate,
    AdminSummaryResponse,
    CadreStatItem,
    DivisionalReadinessItem,
    OfficerCadreItem,
    OfficerDrilldownResponse,
)
from schemas.competency import CompetencyItemResponse
from schemas.course import CourseResponse, EnrolledCourseDetail
from schemas.user import UserResponse
from services.competencies import (
    get_user_competency_matrix,
    resolve_cadre_target_level,
    seed_competencies_from_csv,
)
from services.courses import seed_courses_from_csv
from sqlalchemy import or_
from sqlalchemy.orm import Session

_admin_cache: Dict[str, dict] = {}


def invalidate_admin_cache():
    """Clear cached metrics when any competency or course update occurs."""
    _admin_cache.clear()


def classify_cadre(designation: Optional[str]) -> str:
    if not designation:
        return "General Statistical Cadre"
    des = designation.lower()
    if any(
        k in des
        for k in [
            "ad",
            "dd",
            "jd",
            "director",
            "iss",
            "assistant director",
            "deputy director",
            "joint director",
        ]
    ):
        return "ISS (Indian Statistical Service)"
    if any(
        k in des
        for k in [
            "jso",
            "sso",
            "junior statistical",
            "senior statistical",
            "subordinate",
        ]
    ):
        return "SSS (Subordinate Statistical Service)"
    if any(
        k in des for k in ["des", "state", "statistical assistant", "research officer"]
    ):
        return "DES (State Statistical Cadre)"
    return "Official Statistics Staff"


def _calculate_bulk_user_metrics(
    users: List[schema.User],
    all_competencies: List[schema.Competency],
    all_user_competencies: List[schema.UserCompetency],
) -> Dict[int, dict]:
    """
    Computes competency metrics for all officers in a single in-memory pass.
    Eliminates all N+1 database queries, providing sub-millisecond execution.
    """
    user_comp_lookup: Dict[int, Dict[int, int]] = {}
    for uc in all_user_competencies:
        if uc.user_id not in user_comp_lookup:
            user_comp_lookup[uc.user_id] = {}
        user_comp_lookup[uc.user_id][uc.competency_id] = uc.assessed_level

    parsed_comps = []
    for c in all_competencies:
        try:
            t_dict = (
                json.loads(c.target_levels)
                if isinstance(c.target_levels, str)
                else (c.target_levels or {})
            )
        except Exception:
            t_dict = {}
        parsed_comps.append((c.id, c.department, t_dict))

    results: Dict[int, dict] = {}

    for u in users:
        u_dept = u.department or "National Accounts Division (NAD)"
        u_desig = u.designation or "Junior Statistical Officer (JSO)"
        u_evals = user_comp_lookup.get(u.id, {})

        matched = [
            (c_id, t_dict)
            for (c_id, c_dept, t_dict) in parsed_comps
            if c_dept == u_dept or c_dept == "All Departments"
        ]
        if not matched:
            matched = [(c_id, t_dict) for (c_id, _, t_dict) in parsed_comps]

        achieved_count = 0
        gap_count = 0
        urgent_gap_count = 0
        total_target = 0
        total_assessed = 0

        for c_id, t_dict in matched:
            target = resolve_cadre_target_level(t_dict, u_desig)
            assessed = u_evals.get(c_id, 1)

            total_target += target
            total_assessed += min(assessed, target)

            if assessed >= target:
                achieved_count += 1
            else:
                gap_count += 1
                if (target - assessed) >= 2:
                    urgent_gap_count += 1

        total_comps = len(matched)
        if total_target > 0:
            index = round((total_assessed / total_target) * 100, 1)
        else:
            index = 75.0

        results[u.id] = {
            "composite_skill_index": index,
            "achieved_count": achieved_count,
            "gap_count": gap_count,
            "urgent_gap_count": urgent_gap_count,
            "total_competencies": total_comps,
        }

    return results


def get_admin_dashboard_summary(
    db: Session, force_refresh: bool = False
) -> AdminSummaryResponse:
    now = time.time()
    cache_key = "summary"
    if (
        not force_refresh
        and cache_key in _admin_cache
        and (now - _admin_cache[cache_key]["ts"]) < 30
    ):
        return _admin_cache[cache_key]["data"]

    users = db.query(schema.User).all()
    courses = db.query(schema.Course).all()
    all_enrollments = db.query(schema.UserCourse).all()
    all_competencies = db.query(schema.Competency).all()
    all_user_competencies = db.query(schema.UserCompetency).all()

    total_officers = len(users)
    total_courses = len(courses)
    total_enrollments = len(all_enrollments)
    completed_enrollments = [e for e in all_enrollments if e.status == "completed"]
    total_completions = len(completed_enrollments)
    completion_rate = (
        round((total_completions / total_enrollments * 100), 1)
        if total_enrollments > 0
        else 0.0
    )

    certifications_count = sum(1 for e in all_enrollments if e.certificate_id)

    metrics_by_user = _calculate_bulk_user_metrics(
        users, all_competencies, all_user_competencies
    )

    officer_indices: List[float] = []
    total_active_gaps = 0
    total_urgent_gaps = 0

    dept_stats: Dict[str, dict] = {}
    cadre_stats: Dict[str, dict] = {
        "ISS (Indian Statistical Service)": {"count": 0, "indices": [], "urgent": 0},
        "SSS (Subordinate Statistical Service)": {
            "count": 0,
            "indices": [],
            "urgent": 0,
        },
        "DES (State Statistical Cadre)": {"count": 0, "indices": [], "urgent": 0},
        "Official Statistics Staff": {"count": 0, "indices": [], "urgent": 0},
    }

    standard_divisions = [
        "National Accounts Division (NAD)",
        "Field Operations Division (FOD)",
        "Economic Statistics Division (ESD)",
        "Data Quality & Assurance (DQAD)",
        "Social Statistics Division (SSD)",
    ]
    for d in standard_divisions:
        dept_stats[d] = {
            "officers": 0,
            "indices": [],
            "competencies": 0,
            "achieved": 0,
            "gaps": 0,
            "urgent": 0,
            "enrollments": 0,
            "completions": 0,
        }

    for u in users:
        metrics = metrics_by_user.get(
            u.id,
            {
                "composite_skill_index": 70.0,
                "gap_count": 0,
                "urgent_gap_count": 0,
                "achieved_count": 0,
                "total_competencies": 0,
            },
        )
        idx = metrics["composite_skill_index"]
        officer_indices.append(idx)
        g_count = metrics["gap_count"]
        u_count = metrics["urgent_gap_count"]
        a_count = metrics["achieved_count"]
        t_count = metrics["total_competencies"]

        total_active_gaps += g_count
        total_urgent_gaps += u_count

        dept = u.department or "National Accounts Division (NAD)"
        if dept not in dept_stats:
            dept_stats[dept] = {
                "officers": 0,
                "indices": [],
                "competencies": 0,
                "achieved": 0,
                "gaps": 0,
                "urgent": 0,
                "enrollments": 0,
                "completions": 0,
            }
        dept_stats[dept]["officers"] += 1
        dept_stats[dept]["indices"].append(idx)
        dept_stats[dept]["competencies"] += t_count
        dept_stats[dept]["achieved"] += a_count
        dept_stats[dept]["gaps"] += g_count
        dept_stats[dept]["urgent"] += u_count

        user_enr = [e for e in all_enrollments if e.user_id == u.id]
        dept_stats[dept]["enrollments"] += len(user_enr)
        dept_stats[dept]["completions"] += sum(
            1 for e in user_enr if e.status == "completed"
        )

        c_group = classify_cadre(u.designation)
        if c_group not in cadre_stats:
            cadre_stats[c_group] = {"count": 0, "indices": [], "urgent": 0}
        cadre_stats[c_group]["count"] += 1
        cadre_stats[c_group]["indices"].append(idx)
        cadre_stats[c_group]["urgent"] += u_count

    ministry_index = (
        round(sum(officer_indices) / len(officer_indices), 1)
        if officer_indices
        else 78.4
    )

    divisional_readiness: List[DivisionalReadinessItem] = []
    for d_name, d_data in dept_stats.items():
        avg_idx = (
            round(sum(d_data["indices"]) / len(d_data["indices"]), 1)
            if d_data["indices"]
            else 75.0
        )
        comp_rate = (
            round((d_data["completions"] / d_data["enrollments"] * 100), 1)
            if d_data["enrollments"] > 0
            else 60.0
        )
        divisional_readiness.append(
            DivisionalReadinessItem(
                division=d_name,
                total_officers=d_data["officers"],
                average_skill_index=avg_idx,
                total_competencies=d_data["competencies"] or 8,
                achieved_benchmarks=d_data["achieved"],
                active_gaps=d_data["gaps"],
                urgent_gaps=d_data["urgent"],
                completion_rate=comp_rate,
            )
        )

    cadre_distribution: List[CadreStatItem] = []
    for c_name, c_data in cadre_stats.items():
        avg_idx = (
            round(sum(c_data["indices"]) / len(c_data["indices"]), 1)
            if c_data["indices"]
            else 70.0
        )
        cadre_distribution.append(
            CadreStatItem(
                cadre_group=c_name,
                officer_count=c_data["count"],
                average_skill_index=avg_idx,
                urgent_gaps_count=c_data["urgent"],
            )
        )

    res = AdminSummaryResponse(
        total_officers=total_officers,
        total_courses=total_courses,
        total_enrollments=total_enrollments,
        total_completions=total_completions,
        completion_rate=completion_rate,
        ministry_skill_index=ministry_index,
        active_gaps_count=total_active_gaps,
        urgent_gaps_count=total_urgent_gaps,
        total_certifications_issued=certifications_count,
        divisional_readiness=divisional_readiness,
        cadre_distribution=cadre_distribution,
    )
    _admin_cache[cache_key] = {"data": res, "ts": now}
    return res


def get_cadre_officers_list(
    db: Session,
    search: Optional[str] = None,
    department: Optional[str] = None,
    cadre: Optional[str] = None,
    gap_filter: Optional[str] = None,
    force_refresh: bool = False,
) -> List[OfficerCadreItem]:
    now = time.time()
    raw_cache_key = "officers_raw"

    if (
        not force_refresh
        and raw_cache_key in _admin_cache
        and (now - _admin_cache[raw_cache_key]["ts"]) < 30
    ):
        all_results: List[OfficerCadreItem] = _admin_cache[raw_cache_key]["data"]
    else:
        users = db.query(schema.User).all()
        all_enrollments = db.query(schema.UserCourse).all()
        all_competencies = db.query(schema.Competency).all()
        all_user_competencies = db.query(schema.UserCompetency).all()

        enr_by_user: Dict[int, List[schema.UserCourse]] = {}
        for e in all_enrollments:
            if e.user_id not in enr_by_user:
                enr_by_user[e.user_id] = []
            enr_by_user[e.user_id].append(e)

        metrics_by_user = _calculate_bulk_user_metrics(
            users, all_competencies, all_user_competencies
        )

        all_results = []
        for u in users:
            c_type = classify_cadre(u.designation)
            user_dept = u.department or "Official Statistics"
            metrics = metrics_by_user.get(
                u.id,
                {
                    "composite_skill_index": 70.0,
                    "gap_count": 0,
                    "urgent_gap_count": 0,
                    "achieved_count": 0,
                    "total_competencies": 0,
                },
            )
            u_enr = enr_by_user.get(u.id, [])
            enr_count = len(u_enr)
            comp_count = sum(1 for e in u_enr if e.status == "completed")

            all_results.append(
                OfficerCadreItem(
                    id=u.id,
                    username=u.username,
                    name=u.name,
                    gender=u.gender or "Other",
                    cadre_type=c_type,
                    designation=u.designation or "Statistical Officer",
                    department=user_dept,
                    composite_skill_index=metrics["composite_skill_index"],
                    achieved_count=metrics["achieved_count"],
                    gap_count=metrics["gap_count"],
                    urgent_gap_count=metrics["urgent_gap_count"],
                    enrolled_count=enr_count,
                    completed_count=comp_count,
                    role=getattr(u, "role", "officer") or "officer",
                    created_at=u.created_at,
                )
            )
        _admin_cache[raw_cache_key] = {"data": all_results, "ts": now}

    filtered: List[OfficerCadreItem] = []
    for item in all_results:
        if (
            department
            and department != "all"
            and item.department.lower() != department.lower()
        ):
            continue
        if cadre and cadre != "all" and item.cadre_type.lower() != cadre.lower():
            continue
        if gap_filter == "gaps_only" and item.gap_count == 0:
            continue
        if gap_filter == "urgent_only" and item.urgent_gap_count == 0:
            continue
        if gap_filter == "achieved_only" and item.gap_count > 0:
            continue
        if search:
            q = search.lower()
            if (
                q not in item.name.lower()
                and q not in item.username.lower()
                and q not in item.designation.lower()
                and q not in item.department.lower()
            ):
                continue
        filtered.append(item)

    return filtered


def get_officer_drilldown(db: Session, user_id: int) -> OfficerDrilldownResponse:
    user = db.query(schema.User).filter(schema.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Officer not found.",
        )

    matrix = get_user_competency_matrix(db, user, scope="department")
    idx = matrix.get("composite_skill_index", 0.0)
    achieved = matrix.get("achieved_count", 0)
    gaps = matrix.get("gap_count", 0)
    urgent = matrix.get("urgent_gap_count", 0)
    raw_items = matrix.get("items", [])
    competency_items = [CompetencyItemResponse.model_validate(it) for it in raw_items]

    enrollments = (
        db.query(schema.UserCourse)
        .filter(schema.UserCourse.user_id == user_id)
        .order_by(schema.UserCourse.enrolled_at.desc())
        .all()
    )
    course_ids = [e.course_id for e in enrollments]
    courses = (
        db.query(schema.Course).filter(schema.Course.id.in_(course_ids)).all()
        if course_ids
        else []
    )
    course_map = {c.id: c for c in courses}

    enrolled_details: List[EnrolledCourseDetail] = []
    badges: List[dict] = []

    for enr in enrollments:
        c = course_map.get(enr.course_id)
        if c:
            enrolled_details.append(
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
            if enr.certificate_id:
                badges.append(
                    {
                        "certificate_id": enr.certificate_id,
                        "badge_name": enr.badge_name
                        or f"Verified Specialist: {c.name}",
                        "course_name": c.name,
                        "completed_at": enr.completed_at or enr.enrolled_at,
                    }
                )

    c_type = classify_cadre(user.designation)

    return OfficerDrilldownResponse(
        officer=UserResponse.model_validate(user),
        cadre_type=c_type,
        composite_skill_index=idx,
        achieved_count=achieved,
        gap_count=gaps,
        urgent_gap_count=urgent,
        competencies=competency_items,
        enrolled_courses=enrolled_details,
        badges_earned=badges,
    )


def admin_update_officer_competency(
    db: Session,
    user_id: int,
    competency_id: int,
    new_level: int,
    remarks: Optional[str] = None,
) -> schema.UserCompetency:
    from services.competencies import update_user_competency_score

    invalidate_admin_cache()
    return update_user_competency_score(
        db=db, user_id=user_id, competency_id=competency_id, new_level=new_level
    )


def admin_create_or_update_course(
    db: Session, course_in: AdminCourseCreateOrUpdate, course_id: Optional[int] = None
) -> schema.Course:
    invalidate_admin_cache()
    tags_str = ", ".join(course_in.tags) if course_in.tags else ""
    if course_id:
        course = db.query(schema.Course).filter(schema.Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found.")
        course.name = course_in.name
        course.by = course_in.by
        course.duration = course_in.duration
        course.difficulty_level = course_in.difficulty_level
        course.tags = tags_str
        course.course_description = course_in.course_description
    else:
        course = schema.Course(
            name=course_in.name,
            by=course_in.by,
            duration=course_in.duration,
            difficulty_level=course_in.difficulty_level,
            tags=tags_str,
            course_description=course_in.course_description,
            enrollees=0,
        )
        db.add(course)

    db.commit()
    db.refresh(course)

    if course_in.mapped_competency_ids:
        for comp_id in course_in.mapped_competency_ids:
            comp = (
                db.query(schema.Competency)
                .filter(schema.Competency.id == comp_id)
                .first()
            )
            if comp:
                try:
                    c_ids = (
                        json.loads(comp.mapped_course_ids)
                        if isinstance(comp.mapped_course_ids, str)
                        else comp.mapped_course_ids
                    )
                except Exception:
                    c_ids = []
                if course.id not in c_ids:
                    c_ids.append(course.id)
                    comp.mapped_course_ids = json.dumps(c_ids)
                    db.commit()

    return course


def get_certification_registry(
    db: Session, search: Optional[str] = None
) -> List[AdminCertificationItem]:
    completed = (
        db.query(schema.UserCourse)
        .filter(schema.UserCourse.certificate_id.isnot(None))
        .order_by(schema.UserCourse.completed_at.desc())
        .all()
    )
    if not completed:
        return []

    user_ids = list({e.user_id for e in completed})
    course_ids = list({e.course_id for e in completed})

    users = db.query(schema.User).filter(schema.User.id.in_(user_ids)).all()
    user_map = {u.id: u for u in users}
    courses = db.query(schema.Course).filter(schema.Course.id.in_(course_ids)).all()
    course_map = {c.id: c for c in courses}

    registry: List[AdminCertificationItem] = []
    q = search.lower().strip() if search else None

    for enr in completed:
        u = user_map.get(enr.user_id)
        c = course_map.get(enr.course_id)
        if u and c and enr.certificate_id:
            badge = enr.badge_name or f"Verified Specialist: {c.name}"
            if q:
                if (
                    q not in enr.certificate_id.lower()
                    and q not in u.name.lower()
                    and q not in u.username.lower()
                    and q not in c.name.lower()
                    and q not in badge.lower()
                ):
                    continue

            registry.append(
                AdminCertificationItem(
                    certificate_id=enr.certificate_id,
                    user_id=u.id,
                    user_name=u.name,
                    user_designation=u.designation or "Statistical Officer",
                    user_department=u.department or "Official Statistics",
                    course_id=c.id,
                    course_name=c.name,
                    badge_name=badge,
                    completed_at=enr.completed_at or enr.enrolled_at,
                )
            )
    return registry
