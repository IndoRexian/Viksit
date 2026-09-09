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


def _sync_postgres_sequences():
    """Ensure PostgreSQL primary key sequences and defaults are in place and synchronized."""
    if "sqlite" in db_url:
        return

    tables = ["courses", "users", "competencies", "user_courses", "user_competencies"]
    with engine.connect() as conn:
        for tbl in tables:
            seq_name = f"{tbl}_id_seq"
            try:
                is_identity = conn.execute(
                    text(
                        f"SELECT is_identity FROM information_schema.columns "
                        f"WHERE table_name = '{tbl}' AND column_name = 'id';"
                    )
                ).scalar()

                if is_identity != "YES":
                    conn.execute(
                        text(
                            f"CREATE SEQUENCE IF NOT EXISTS {seq_name}; "
                            f"ALTER TABLE {tbl} ALTER COLUMN id SET DEFAULT nextval('{seq_name}');"
                        )
                    )

                conn.execute(text(f"""
                        DO $$
                        DECLARE
                            max_val BIGINT;
                        BEGIN
                            SELECT COALESCE(MAX(id), 0) + 1 INTO max_val FROM {tbl};
                            IF EXISTS (SELECT 1 FROM pg_class WHERE relname = '{seq_name}' AND relkind = 'S') THEN
                                PERFORM setval('{seq_name}', max_val, false);
                            END IF;
                        END $$;
                        """))
                conn.commit()
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass


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
        _sync_postgres_sequences()
    except Exception as e:
        print(f"Sequence sync notice: {e}")

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
