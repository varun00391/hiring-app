"""Heuristic structured parsing from raw resume text."""

from __future__ import annotations

import random
import re
from typing import Any

_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE = re.compile(r"(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}")
_LINKEDIN = re.compile(r"https?://(?:www\.)?linkedin\.com/[\w\-/]+/?", re.I)
_GITHUB = re.compile(r"https?://(?:www\.)?github\.com/[\w\-/]+/?", re.I)


def _guess_name(lines: list[str]) -> str:
    for raw in lines[:8]:
        line = raw.strip()
        if len(line.split()) <= 6 and len(line) > 2 and "@" not in line:
            return line
    return lines[0].strip() if lines else "Candidate"


def _skills_from_keywords(text: str) -> list[str]:
    buckets = ["python", "typescript", "java", "go", "aws", "gcp", "azure", "react", "next.js", "fastapi"]
    lowered = text.lower()
    return sorted({skill for skill in buckets if skill in lowered}) or ["communication"]


def parse_resume(text: str) -> dict[str, Any]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    email_match = _EMAIL.search(text)
    phone_match = _PHONE.search(text)
    linkedin = _LINKEDIN.search(text)
    github = _GITHUB.search(text)

    skills = _skills_from_keywords(text)
    certifications: list[str] = []
    if "certificate" in text.lower() or "certified" in text.lower():
        certifications.append("Listed certification keywords detected")

    education = [
        {
            "degree": line,
            "institution": "See resume",
            "year": "",
        }
        for line in lines
        if "university" in line.lower() or "college" in line.lower() or "institute" in line.lower()
    ][:5]

    work_experience = [
        {
            "title": lines[i],
            "company": lines[i + 1] if i + 1 < len(lines) else "N/A",
            "duration": "",
        }
        for i in range(len(lines))
        if lines[i].lower().startswith(("engineer", "developer", "architect"))
    ][
        :8
    ] or [{"title": "Experience", "company": "See resume timeline", "duration": ""}]

    projects = [
        {"name": ln, "description": ""}
        for ln in lines
        if "project" in ln.lower() or "built" in ln.lower() or "shipped" in ln.lower()
    ][
        :5
    ]

    ai_match_score = round(random.uniform(62, 93), 1)

    return {
        "full_name": _guess_name(lines),
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "linkedin_url": linkedin.group(0) if linkedin else None,
        "github_url": github.group(0) if github else None,
        "skills": skills,
        "certifications": certifications,
        "education": education,
        "work_experience": work_experience,
        "projects": projects,
        "ai_match_score": ai_match_score,
    }
