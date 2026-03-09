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
    admin_email: str | None = Field(default=None, alias="ADMIN_EMAIL")
    vapid_public_key: str | None = Field(default=None, alias="VAPID_PUBLIC_KEY")
    vapid_private_key: str | None = Field(default=None, alias="VAPID_PRIVATE_KEY")
    vapid_subject: str = Field("mailto:admin@mateco.app", alias="VAPID_SUBJECT")
    app_timezone: str = Field("America/Argentina/Buenos_Aires", alias="APP_TIMEZONE")
    admin_username: str | None = Field(default=None, alias="ADMIN_USERNAME")
    admin_password: str | None = Field(default=None, alias="ADMIN_PASSWORD")
    cors_origins: str = Field(
        "http://localhost:3000,http://127.0.0.1:3000",
        alias="CORS_ORIGINS",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
