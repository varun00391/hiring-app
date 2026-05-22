"""Groq LLM-based resume parsing service."""

import json
import logging
import re
from typing import Any

from groq import AsyncGroq
from pydantic import ValidationError

from app.config import Settings
from app.exceptions import LLMParsingError
from app.models.schemas import ParsedResume

logger = logging.getLogger(__name__)

RESUME_PARSE_SYSTEM_PROMPT = """You are an expert resume parser for an ATS hiring platform.
Extract structured information from unstructured resume text.

Rules:
- Return ONLY valid JSON matching the schema below.
- Use null for missing scalar fields and empty arrays for missing lists.
- Normalize dates to YYYY-MM or YYYY when possible; use "Present" for current roles in end_date.
- Deduplicate skills; separate technical_skills vs soft_skills when identifiable.
- Infer total_experience_years as a float from work history when explicit duration is absent.
- Fix common OCR errors in emails, phone numbers, and URLs when confident.
- Do not invent information not supported by the resume text.

JSON schema:
{
  "full_name": string|null,
  "email": string|null,
  "phone": string|null,
  "location": string|null,
  "linkedin": string|null,
  "github": string|null,
  "current_company": string|null,
  "total_experience_years": number|null,
  "summary": string|null,
  "skills": string[],
  "technical_skills": string[],
  "soft_skills": string[],
  "languages": [{"language": string|null, "proficiency": string|null}],
  "experience": [{
    "company": string|null,
    "title": string|null,
    "location": string|null,
    "start_date": string|null,
    "end_date": string|null,
    "is_current": boolean,
    "description": string|null,
    "highlights": string[]
  }],
  "education": [{
    "institution": string|null,
    "degree": string|null,
    "field_of_study": string|null,
    "start_date": string|null,
    "end_date": string|null,
    "grade": string|null,
    "description": string|null
  }],
  "certifications": [{
    "name": string|null,
    "issuer": string|null,
    "date": string|null,
    "credential_id": string|null,
    "url": string|null
  }],
  "projects": [{
    "name": string|null,
    "description": string|null,
    "technologies": string[],
    "url": string|null,
    "start_date": string|null,
    "end_date": string|null,
    "highlights": string[]
  }],
  "achievements": [{
    "title": string|null,
    "description": string|null,
    "date": string|null
  }]
}
"""


class LLMResumeParser:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: AsyncGroq | None = None

    @property
    def client(self) -> AsyncGroq:
        if self._client is None:
            if not self._settings.groq_api_key:
                raise LLMParsingError(
                    "Groq API key is not configured.",
                    details={"env_var": "GROQ_API_KEY"},
                )
            self._client = AsyncGroq(api_key=self._settings.groq_api_key)
        return self._client

    async def parse(self, resume_text: str) -> ParsedResume:
        last_error: Exception | None = None

        for attempt in range(1, self._settings.groq_max_retries + 2):
            try:
                raw = await self._call_llm(resume_text)
                payload = self._extract_json(raw)
                return self._validate_payload(payload)
            except (LLMParsingError, ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
                logger.warning(
                    "LLM parse attempt failed",
                    extra={"extra_fields": {"attempt": attempt, "error": str(exc)}},
                )

        raise LLMParsingError(
            "Failed to parse resume using LLM after multiple attempts.",
            details={"reason": str(last_error)},
        )

    async def _call_llm(self, resume_text: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self._settings.groq_model,
                temperature=0.1,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": RESUME_PARSE_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            "Parse the following resume text into the required JSON schema:\n\n"
                            f"{resume_text[:120000]}"
                        ),
                    },
                ],
                timeout=self._settings.groq_timeout_seconds,
            )
        except Exception as exc:
            logger.exception("Groq API call failed")
            raise LLMParsingError(
                "Groq API request failed.",
                details={"reason": str(exc)},
            ) from exc

        content = response.choices[0].message.content
        if not content:
            raise LLMParsingError("Groq returned an empty response.")
        return content

    @staticmethod
    def _extract_json(raw: str) -> dict[str, Any]:
        raw = raw.strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if not match:
                raise
            return json.loads(match.group(0))

    @staticmethod
    def _validate_payload(payload: dict[str, Any]) -> ParsedResume:
        # Coerce invalid emails to None instead of failing the whole request
        email = payload.get("email")
        if email and not isinstance(email, str):
            payload["email"] = None

        try:
            return ParsedResume.model_validate(payload)
        except ValidationError as exc:
            sanitized = payload.copy()
            if "email" in sanitized:
                sanitized["email"] = None
            try:
                return ParsedResume.model_validate(sanitized)
            except ValidationError:
                raise LLMParsingError(
                    "LLM output did not match the expected resume schema.",
                    details={"validation_errors": exc.errors()},
                ) from exc
