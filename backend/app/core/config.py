import os
from typing import List, Optional
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "SIH 2026 API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    SUPABASE_URL: Optional[str] = None
    GEMINI_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./sih2026.db"
    APP_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    TZ: ZoneInfo = ZoneInfo("Asia/Kolkata")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
