"""Helpers for deriving candidate fields from parsed resume data."""

from app.models.candidate_schemas import POSITION_FALLBACK
from app.models.schemas import ParsedResume


def derive_position_applied(
    parsed: ParsedResume,
    override: str | None = None,
) -> str:
    """Use explicit override, else current/latest job title, else fallback."""
    if override and override.strip():
        return override.strip()

    for experience in parsed.experience:
        if experience.is_current and experience.title and experience.title.strip():
            return experience.title.strip()

    for experience in parsed.experience:
        if experience.title and experience.title.strip():
            return experience.title.strip()

    return POSITION_FALLBACK
