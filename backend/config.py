import os
from pathlib import Path
from typing import List, Union
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure .env is explicitly loaded from backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(env_path),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./reviews.db")
    ALLOWED_ORIGINS: Union[str, List[str]] = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000")
    CLERK_PUBLISHABLE_KEY: str = os.getenv("CLERK_PUBLISHABLE_KEY", "")
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
    TESTING: bool = False

    def get_allowed_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
        origins = [o.strip() for o in str(self.ALLOWED_ORIGINS).split(",") if o.strip()]
        return origins if origins else ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]

settings = Settings()
