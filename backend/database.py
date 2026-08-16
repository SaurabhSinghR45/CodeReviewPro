import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

# Ensure sqlite parent directory exists if path specified
if "sqlite" in settings.DATABASE_URL:
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_path and not db_path.startswith(":memory:"):
        db_dir = os.path.dirname(os.path.abspath(db_path))
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    if "sqlite" in settings.DATABASE_URL:
        db_file = settings.DATABASE_URL.replace("sqlite:///", "")
        if os.path.exists(db_file):
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            try:
                cursor.execute("PRAGMA table_info(reviews)")
                columns = [col[1] for col in cursor.fetchall()]
                if "user_email" not in columns:
                    cursor.execute("ALTER TABLE reviews ADD COLUMN user_email TEXT DEFAULT 'guest@codereview.pro'")
                    conn.commit()
                if "remediated_code" not in columns:
                    cursor.execute("ALTER TABLE reviews ADD COLUMN remediated_code TEXT DEFAULT ''")
                    conn.commit()
            except Exception:
                pass
            finally:
                conn.close()

init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
