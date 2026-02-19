from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # -----------------------------
    # Database
    # -----------------------------
    DATABASE_URL: str = "postgresql://rishi:password@localhost/ved_memory"

    # -----------------------------
    # JWT Configuration
    # -----------------------------
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
