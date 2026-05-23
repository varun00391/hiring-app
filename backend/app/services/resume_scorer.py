"""Compute AI-style resume quality scores."""

from app.models.schemas import ParsedResume, StandardResumeTemplate


class ResumeScorer:
    """Heuristic resume score (0-100) derived from parsed completeness and content."""

    def score(
        self,
        parsed: ParsedResume,
        standard: StandardResumeTemplate,
    ) -> float:
        completeness = float(standard.metadata.get("completeness_score", 0)) * 40

        contact_score = 0.0
        if parsed.email:
            contact_score += 8
        if parsed.phone:
            contact_score += 7
        if parsed.linkedin or parsed.github:
            contact_score += 5

        experience_score = min(len(parsed.experience) * 6, 18)
        education_score = min(len(parsed.education) * 5, 10)
        skills_score = min(
            len(set(parsed.technical_skills + parsed.skills + parsed.soft_skills)) * 1.5,
            12,
        )
        extras_score = 0.0
        if parsed.certifications:
            extras_score += 4
        if parsed.projects:
            extras_score += 4

        total = completeness + contact_score + experience_score + education_score + skills_score + extras_score
        return round(min(total, 100.0), 1)
