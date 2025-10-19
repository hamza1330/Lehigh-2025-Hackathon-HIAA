from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="LOCKIN_", env_file=(".env",))

    app_name: str = "LockIN API"
    debug: bool = False
    allow_anonymous: bool = False
    database_url: str
    aws_region: str | None = None
    cognito_user_pool_id: str | None = None
    cognito_app_client_id: str | None = None
    s3_bucket: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]
