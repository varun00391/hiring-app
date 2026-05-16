from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "HireBot API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    database_url: str = "postgresql+asyncpg://hirebot:hirebot@localhost:5432/hirebot"

    upload_dir: str = "/data/uploads"
    max_upload_mb: int = 10
    max_files_per_request: int = 50

    cors_origins: str = "http://localhost:3000"

    # When true (e.g. UNIFY_DEMO_PASSWORDS=true in Docker), overwrites seeded admin/TAG bcrypt hashes each startup so all demo accounts use the same login.
    unify_demo_passwords: bool = Field(default=False)

    @property
    def cors_origin_list(self) -> list[str]:
        # Browsers send Origin without a trailing slash; env mistakes like
        # http://host:3000/ would otherwise yield OPTIONS 400 from CORSMiddleware.
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
