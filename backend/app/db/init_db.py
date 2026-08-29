import os

from core.config import settings
from db import schema
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

db_url = settings.SUPABASE_URL or settings.DATABASE_URL or "sqlite:///./sih2026.db"

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
    )
else:
    connect_args = {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate_columns():
    """Ensure newly added columns exist in existing PostgreSQL/SQLite tables."""
    migration_statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'officer';",
        "ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;",
        "ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress';",
        "ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITHOUT TIME ZONE;",
        "ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS certificate_id TEXT;",
        "ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS badge_name TEXT;",
    ]
    with engine.connect() as conn:
        for stmt in migration_statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                # For SQLite which doesn't support IF NOT EXISTS or already added
                try:
                    conn.rollback()
                except Exception:
                    pass


def init_db():
    schema.Base.metadata.create_all(bind=engine)
    try:
        _migrate_columns()
    except Exception as e:
        print(f"Migration notice: {e}")

    try:
        from services.competencies import seed_competencies_from_csv
        from services.courses import seed_courses_from_csv

        db = SessionLocal()
        try:
            seed_courses_from_csv(db)
            seed_competencies_from_csv(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Database seeding notice: {e}")
