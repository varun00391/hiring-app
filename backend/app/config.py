"""Application configuration loaded from environment variables."""

import json
from functools import lru_cache
from typing import Literal, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _coerce_string_list(value: Union[str, list[str]]) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]

    raw = value.strip()
    if not raw:
        return []

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except json.JSONDecodeError:
        pass

    if raw.startswith("[") and raw.endswith("]"):
        inner = raw[1:-1].strip()
        if not inner:
            return []
        return [item.strip().strip('"').strip("'") for item in inner.split(",") if item.strip()]

    if "," in raw:
        return [item.strip() for item in raw.split(",") if item.strip()]

    return [raw]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "HireBot Resume Parser"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"

    api_prefix: str = "/api/v1"
    # Union[str, list[str]] avoids pydantic-settings JSON-decoding env values before validation.
    cors_origins: Union[str, list[str]] = Field(
        default='["http://localhost:5173","http://localhost:3000","http://localhost:8080"]'
    )

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_timeout_seconds: float = 60.0
    groq_max_retries: int = 2

    max_upload_size_mb: int = 10
    allowed_extensions: Union[str, list[str]] = Field(default='[".pdf",".doc",".docx"]')
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

    @field_validator("cors_origins", "allowed_extensions", mode="after")
    @classmethod
    def normalize_string_list_fields(cls, value: Union[str, list[str]]) -> list[str]:
        return _coerce_string_list(value)


@lru_cache
def get_settings() -> Settings:
    return Settings()
