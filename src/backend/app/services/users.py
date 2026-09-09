import json
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from core.config import settings
from core.security import (
    create_access_token,
    get_password_hash,
    hash_email,
    verify_password,
)
from db import schema
from fastapi import HTTPException, status
from schemas.user import TokenResponse, UserCreate, UserLogin, UserResponse
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


def create_user(db: Session, user_in: UserCreate) -> TokenResponse:
    """
    Registers a new user after verifying unique username, phone, and email.
    Returns access_token and user profile.
    """
    email_h = hash_email(user_in.email)

    existing_username = (
        db.query(schema.User).filter(schema.User.username == user_in.username).first()
    )
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken.",
        )

    existing_phone = (
        db.query(schema.User).filter(schema.User.phone == user_in.phone).first()
    )
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered.",
        )

    existing_email = (
        db.query(schema.User).filter(schema.User.email_hash == email_h).first()
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered.",
        )

    hashed_pwd = get_password_hash(user_in.password)

    dob_val = user_in.dob
    if isinstance(dob_val, datetime):
        dob_val = dob_val.date()

    user_entry = schema.User(
        username=user_in.username,
        name=user_in.name,
        gender=user_in.gender or "Other",
        dob=dob_val,
        phone=user_in.phone,
        designation=user_in.designation or "Statistical Officer",
        department=user_in.department or "Official Statistics",
        qualifications=json.dumps(user_in.qualifications or []),
        experience=json.dumps(user_in.experience or []),
        email_hash=email_h,
        password=hashed_pwd,
        role=user_in.role or "officer",
        created_at=datetime.utcnow(),
    )

    try:
        db.add(user_entry)
        db.commit()
        db.refresh(user_entry)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with these unique credentials already exists.",
        )

    access_token = create_access_token(
        subject=str(user_entry.id),
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user_entry),
    )


def authenticate_user(db: Session, login_data: UserLogin) -> TokenResponse:
    """
    Authenticates a user via username, email, or phone + password.
    Returns access_token and user profile.
    """
    user = None

    if login_data.username:
        user = (
            db.query(schema.User)
            .filter(schema.User.username == login_data.username)
            .first()
        )
    elif login_data.email:
        email_h = hash_email(login_data.email)
        user = db.query(schema.User).filter(schema.User.email_hash == email_h).first()
    elif login_data.phone:
        user = (
            db.query(schema.User).filter(schema.User.phone == login_data.phone).first()
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a username, email, or phone number to log in.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. User not found.",
        )

    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Incorrect password.",
        )

    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


def get_user_by_id(db: Session, user_id: str) -> schema.User:
    """Retrieve user by integer ID."""
    try:
        u_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format.",
        )

    user = db.query(schema.User).filter(schema.User.id == u_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return user


def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[schema.User]:
    """List users."""
    return db.query(schema.User).offset(skip).limit(limit).all()


def check_username_exists(db: Session, username: str) -> bool:
    """Checks whether a username already exists in the database."""
    cleaned = username.strip()
    if not cleaned:
        return False
    user = db.query(schema.User).filter(schema.User.username == cleaned).first()
    return user is not None
