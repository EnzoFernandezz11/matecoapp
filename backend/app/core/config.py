from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "MatecoApp"
    database_url: str = Field(..., alias="DATABASE_URL")
    google_client_id: str = Field(..., alias="GOOGLE_CLIENT_ID")
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_expire_hours: int = Field(168, alias="JWT_EXPIRE_HOURS")
    jwt_algorithm: str = "HS256"
    admin_username: str | None = Field(default=None, alias="ADMIN_USERNAME")
    admin_password: str | None = Field(default=None, alias="ADMIN_PASSWORD")


@lru_cache
def get_settings() -> Settings:
    return Settings()
