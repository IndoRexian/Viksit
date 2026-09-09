import csv
import json
import os
from datetime import datetime
from typing import Dict, List, Optional

from db import schema
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


def seed_competencies_from_csv(db: Session, csv_path: Optional[str] = None) -> int:
    """
    Populates the competencies table from competencies.csv? if table is empty.
    """
    if db.query(schema.Competency).first() is not None:
        return 0

    if not csv_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        csv_path = os.path.join(base_dir, "data", "competencies.csv")

    if not os.path.exists(csv_path):
        return 0

    seeded_count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                c_id = int(row.get("id")) if row.get("id") else None
                comp = schema.Competency(
                    id=c_id,
                    code=row.get("code"),
                    name=row.get("name"),
                    department=row.get("department"),
                    category=row.get("category") or "Domain",
                    description=row.get("description"),
                    target_levels=row.get("target_levels") or "{}",
                    mapped_course_ids=row.get("mapped_course_ids") or "[]",
                    mapped_course_names=row.get("mapped_course_names") or "",
                )
                db.add(comp)
                seeded_count += 1
            except Exception as e:
                print(f"Error seeding row {row}: {e}")
                continue

    if seeded_count > 0:
        db.commit()
    return seeded_count


def resolve_cadre_target_level(
    target_levels: Dict[str, int], designation: Optional[str]
) -> int:
    """
    Resolves the benchmark level required for the user's specific designation.
    """
    if not designation:
        return 3

    desig = designation.lower()

    for k, v in target_levels.items():
        if k.lower() in desig or desig in k.lower():
            return int(v)

    if "junior" in desig or "jso" in desig:
        return target_levels.get("JSO", 3)
    if "senior" in desig or "sso" in desig:
        return target_levels.get("SSO", 4)

    if "assistant director" in desig or "ad" in desig:
        return target_levels.get("AD", 4)
    if "deputy director" in desig or "dd" in desig:
        return target_levels.get("DD", 5)
    if "joint director" in desig:
        if "state" in desig or "des" in desig:
            return target_levels.get("Joint Director (DES)", 4)
        return target_levels.get("JD", 5)
    if "director" in desig or "ddg" in desig or "adg" in desig:
        return target_levels.get("Director", 5)

    if "assistant" in desig or "investigator" in desig:
        return target_levels.get("Statistical Assistant", 2)
    if "research officer" in desig:
        return target_levels.get("Research Officer", 3)

    return target_levels.get("Other", 3)


def get_user_competency_matrix(
    db: Session, user: schema.User, scope: str = "department"
) -> dict:
    """
    Retrieves the complete personalized FRAC Competency Matrix for the user.
    Auto-initializes user_competency evaluation rows if missing.
    scope: 'department' (user's department + shared) or 'all' (all MoSPI divisions)
    """
    user_dept = user.department or "National Accounts Division (NAD)"
    user_desig = user.designation or "Junior Statistical Officer (JSO)"

    all_competencies = db.query(schema.Competency).all()

    if not all_competencies:
        seed_competencies_from_csv(db)
        all_competencies = db.query(schema.Competency).all()

    if scope == "all":
        matched_competencies = all_competencies
    else:
        matched_competencies = [
            c
            for c in all_competencies
            if c.department == user_dept or c.department == "All Departments"
        ]

    if not matched_competencies:
        matched_competencies = all_competencies

    seen_comp_ids = set()
    unique_competencies = []
    for comp in matched_competencies:
        if comp.id not in seen_comp_ids:
            seen_comp_ids.add(comp.id)
            unique_competencies.append(comp)

    existing_evals = (
        db.query(schema.UserCompetency)
        .filter(schema.UserCompetency.user_id == user.id)
        .all()
    )
    evaluations_by_comp_id: Dict[int, schema.UserCompetency] = {
        ue.competency_id: ue for ue in existing_evals
    }

    new_evals_to_add = []
    for comp in unique_competencies:
        if comp.id not in evaluations_by_comp_id:
            try:
                target_dict = (
                    json.loads(comp.target_levels)
                    if isinstance(comp.target_levels, str)
                    else comp.target_levels
                )
            except Exception:
                target_dict = {}

            target_lvl = resolve_cadre_target_level(target_dict, user_desig)
            baseline_level = 1
            user_eval = schema.UserCompetency(
                user_id=user.id,
                competency_id=comp.id,
                assessed_level=baseline_level,
                status=(
                    "Benchmark Achieved"
                    if baseline_level >= target_lvl
                    else "Skill Gap Identified"
                ),
                last_assessed_at=datetime.utcnow(),
            )
            new_evals_to_add.append(user_eval)
            evaluations_by_comp_id[comp.id] = user_eval

    if new_evals_to_add:
        try:
            db.add_all(new_evals_to_add)
            db.commit()
            for ne in new_evals_to_add:
                db.refresh(ne)
        except Exception:
            db.rollback()
            existing_evals = (
                db.query(schema.UserCompetency)
                .filter(schema.UserCompetency.user_id == user.id)
                .all()
            )
            evaluations_by_comp_id = {ue.competency_id: ue for ue in existing_evals}

    items = []
    total_progress = 0.0
    achieved_count = 0
    gap_count = 0
    urgent_gap_count = 0

    divisions_map: Dict[str, List[dict]] = {}

    for comp in unique_competencies:
        try:
            target_dict = (
                json.loads(comp.target_levels)
                if isinstance(comp.target_levels, str)
                else comp.target_levels
            )
        except Exception:
            target_dict = {}

        target_lvl = resolve_cadre_target_level(target_dict, user_desig)

        try:
            course_ids = (
                json.loads(comp.mapped_course_ids)
                if isinstance(comp.mapped_course_ids, str)
                else comp.mapped_course_ids
            )
        except Exception:
            course_ids = []

        course_names = [
            name.strip()
            for name in (comp.mapped_course_names or "").split(";")
            if name.strip()
        ]

        user_eval = evaluations_by_comp_id.get(comp.id)
        assessed_lvl = user_eval.assessed_level if user_eval else 1
        is_achieved = assessed_lvl >= target_lvl
        gap = max(0, target_lvl - assessed_lvl)
        is_urgent = gap >= 2 or (assessed_lvl == 1 and target_lvl >= 3)

        if is_achieved:
            achieved_count += 1
            status_text = "Benchmark Achieved"
        else:
            gap_count += 1
            if is_urgent:
                urgent_gap_count += 1
            status_text = "Skill Gap Identified"

        if target_lvl <= 1:
            comp_progress = 1.0 if assessed_lvl >= 1 else 0.0
        else:
            if assessed_lvl >= target_lvl:
                comp_progress = 1.0
            else:
                comp_progress = max(0.0, (assessed_lvl - 1) / (target_lvl - 1))

        total_progress += comp_progress

        item_data = {
            "id": comp.id,
            "code": comp.code,
            "name": comp.name,
            "department": comp.department,
            "category": comp.category,
            "description": comp.description,
            "target_level": target_lvl,
            "target_levels": target_dict,
            "assessed_level": assessed_lvl,
            "status": status_text,
            "gap": gap,
            "mapped_course_ids": course_ids,
            "mapped_course_names": course_names,
            "last_assessed_at": (
                user_eval.last_assessed_at if user_eval else datetime.utcnow()
            ),
        }
        items.append(item_data)

        dept_name = comp.department or "General"
        if dept_name not in divisions_map:
            divisions_map[dept_name] = []
        divisions_map[dept_name].append(item_data)

    composite_index = round((total_progress / len(items) * 100), 1) if items else 0.0

    division_summaries = []
    for div_name, div_items in divisions_map.items():
        div_total = len(div_items)
        div_achieved = sum(1 for it in div_items if it["gap"] == 0)
        div_gaps = div_total - div_achieved
        div_urgent = sum(
            1
            for it in div_items
            if it["gap"] >= 2 or (it["assessed_level"] == 1 and it["target_level"] >= 3)
        )
        div_progress = 0.0
        for it in div_items:
            t_lvl = it["target_level"]
            a_lvl = it["assessed_level"]
            if t_lvl <= 1:
                div_progress += 1.0 if a_lvl >= 1 else 0.0
            elif a_lvl >= t_lvl:
                div_progress += 1.0
            else:
                div_progress += max(0.0, (a_lvl - 1) / (t_lvl - 1))

        div_pct = round((div_progress / div_total * 100), 1) if div_total > 0 else 0.0
        division_summaries.append(
            {
                "division": div_name,
                "total_competencies": div_total,
                "achieved_count": div_achieved,
                "gap_count": div_gaps,
                "urgent_gap_count": div_urgent,
                "average_fulfillment_pct": div_pct,
                "items": div_items,
            }
        )

    return {
        "composite_skill_index": composite_index,
        "total_competencies": len(items),
        "achieved_count": achieved_count,
        "gap_count": gap_count,
        "urgent_gap_count": urgent_gap_count,
        "user_designation": user_desig,
        "user_department": user_dept,
        "items": items,
        "division_summaries": division_summaries,
    }


def update_user_competency_score(
    db: Session, user_id: int, competency_id: int, new_level: int
) -> schema.UserCompetency:
    """
    Updates an officer's assessed level for a competency.
    """
    if new_level < 1 or new_level > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessed level must be between 1 and 5.",
        )

    user_eval = (
        db.query(schema.UserCompetency)
        .filter(
            schema.UserCompetency.user_id == user_id,
            schema.UserCompetency.competency_id == competency_id,
        )
        .first()
    )

    comp = (
        db.query(schema.Competency)
        .filter(schema.Competency.id == competency_id)
        .first()
    )
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competency not found.",
        )

    user = db.query(schema.User).filter(schema.User.id == user_id).first()
    target_dict = (
        json.loads(comp.target_levels)
        if isinstance(comp.target_levels, str)
        else comp.target_levels
    )
    target_lvl = resolve_cadre_target_level(
        target_dict, user.designation if user else None
    )

    status_text = (
        "Benchmark Achieved" if new_level >= target_lvl else "Skill Gap Identified"
    )

    if not user_eval:
        user_eval = schema.UserCompetency(
            user_id=user_id,
            competency_id=competency_id,
            assessed_level=new_level,
            status=status_text,
            last_assessed_at=datetime.utcnow(),
        )
        db.add(user_eval)
    else:
        user_eval.assessed_level = new_level
        user_eval.status = status_text
        user_eval.last_assessed_at = datetime.utcnow()

    db.commit()
    db.refresh(user_eval)
    return user_eval
