from typing import List

from core.dependencies import get_current_user
from db import schema
from db.init_db import get_db
from fastapi import APIRouter, Depends, Query, status
from schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UsernameCheckResponse,
    UserResponse,
)
from services import users as user_service
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    "/check-username",
    response_model=UsernameCheckResponse,
    summary="Check if a username exists",
)
def check_username(
    username: str = Query(..., min_length=1, description="Username to check"),
    db: Session = Depends(get_db),
):
    """
    Checks if a username is already taken.
    Returns exists (True/False) and available (True/False).
    """
    exists = user_service.check_username_exists(db=db, username=username)
    return UsernameCheckResponse(
        username=username,
        exists=exists,
        available=not exists,
        message="Username is already taken." if exists else "Username is available.",
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user / official account",
)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user after verifying unique username, phone, and email.
    Returns access token and newly created profile.
    """
    return user_service.create_user(db=db, user_in=user_in)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT token",
)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate using username/email/phone + password.
    Returns JWT access token and user profile.
    """
    return user_service.authenticate_user(db=db, login_data=login_data)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def read_current_user(current_user: schema.User = Depends(get_current_user)):
    """Returns the current authenticated official's profile."""
    return current_user


@router.get(
    "/",
    response_model=List[UserResponse],
    summary="List all users (Protected)",
)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    """Lists registered users."""
    return user_service.get_all_users(db=db, skip=skip, limit=limit)
