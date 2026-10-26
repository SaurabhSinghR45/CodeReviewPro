import os
import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

is_sqlite = "sqlite" in settings.DATABASE_URL

# Ensure sqlite parent directory exists if path specified
if is_sqlite:
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_path and not db_path.startswith(":memory:"):
        db_dir = os.path.dirname(os.path.abspath(db_path))
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

connect_args = {}
if is_sqlite:
    connect_args = {
        "check_same_thread": False,
        "timeout": 15
    }

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
)

if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL;")
            cursor.execute("PRAGMA synchronous=NORMAL;")
        except Exception:
            pass
        finally:
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    if is_sqlite:
        db_file = settings.DATABASE_URL.replace("sqlite:///", "")
        if os.path.exists(db_file):
            conn = sqlite3.connect(db_file, timeout=15)
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
