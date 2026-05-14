"""Email validation suitable for internal accounts (.local, etc.)."""

from __future__ import annotations

from typing import Annotated

import email_validator
from pydantic import AfterValidator


def _normalize_work_email(value: str) -> str:
    cleaned = value.strip().lower()
    email_validator.validate_email(cleaned, check_deliverability=False)
    return cleaned


WorkEmail = Annotated[str, AfterValidator(_normalize_work_email)]
