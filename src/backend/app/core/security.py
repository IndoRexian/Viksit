import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

from core.config import settings
import jwt


def hash_email(email: str) -> str:
    """Deterministic SHA-256 hash for email indexing and duplicate lookup."""
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()


def get_password_hash(password: str) -> str:
    """Generate a secure salted PBKDF2-HMAC-SHA256 password hash."""
    salt = secrets.token_hex(16)
    iterations = 100000
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return f"pbkdf2:sha256:{iterations}${salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored salted hash using constant-time comparison."""
    try:
        parts = hashed_password.split("$")
        if len(parts) == 3 and parts[0].startswith("pbkdf2:sha256:"):
            iterations = int(parts[0].split(":")[2])
            salt = parts[1]
            stored_key = parts[2]
            calculated_key = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations,
            ).hex()
            return secrets.compare_digest(stored_key, calculated_key)
        return False
    except Exception:
        return False


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc),
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.APP_SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token, settings.APP_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except Exception:
        return None


def get_userid(token: str) -> Optional[str]:
    """Extract user_id subject from JWT token."""
    payload = decode_token(token)
    if payload:
        return payload.get("sub")
    return None
