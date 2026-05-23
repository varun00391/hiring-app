"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "HireBot Resume Parser"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"

    api_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"])

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_timeout_seconds: float = 60.0
    groq_max_retries: int = 2

    max_upload_size_mb: int = 10
    allowed_extensions: list[str] = Field(default_factory=lambda: [".pdf", ".doc", ".docx"])
    upload_temp_dir: str = "/tmp/hirebot/uploads"
    data_dir: str = "/tmp/hirebot/data"

    log_level: str = "INFO"
    log_format: Literal["json", "text"] = "json"

    # SMTP (outbound email)
    smtp_enabled: bool = False
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True

    # IMAP (inbound reply polling)
    imap_enabled: bool = False
    imap_host: str = "imap.gmail.com"
    imap_port: int = 993
    imap_username: str = ""
    imap_password: str = ""
    imap_mailbox: str = "INBOX"
    inbox_poll_interval_seconds: int = 120

    # Recruiter / company defaults
    company_name: str = "HireBot"
    recruiter_signature: str = "Alex Morgan\nSenior Recruiter\nHireBot"


@lru_cache
def get_settings() -> Settings:
    return Settings()
