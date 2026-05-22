"""Text cleaning and preprocessing for resume parsing."""

import re
import unicodedata


class TextPreprocessor:
    """Normalize extracted resume text before LLM parsing."""

    _BULLET_PATTERN = re.compile(r"[\u2022\u2023\u25E6\u2043\u2219\u00B7•●▪◦]")
    _MULTISPACE = re.compile(r"[ \t]{2,}")
    _MULTINEWLINE = re.compile(r"\n{3,}")
    _PAGE_NUMBER = re.compile(r"(?m)^\s*page\s+\d+\s*(of\s+\d+)?\s*$", re.IGNORECASE)
    _EMAIL_OCR_FIXES = (
        (re.compile(r"\s+@\s+"), "@"),
        (re.compile(r"\s+\.\s+"), "."),
        (re.compile(r"\(at\)", re.I), "@"),
        (re.compile(r"\[at\]", re.I), "@"),
        (re.compile(r"\(dot\)", re.I), "."),
        (re.compile(r"\[dot\]", re.I), "."),
    )

    def clean(self, text: str) -> tuple[str, list[str]]:
        warnings: list[str] = []
        cleaned = text

        cleaned = unicodedata.normalize("NFKC", cleaned)
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
        cleaned = self._BULLET_PATTERN.sub("-", cleaned)
        cleaned = self._PAGE_NUMBER.sub("", cleaned)

        for pattern, replacement in self._EMAIL_OCR_FIXES:
            cleaned = pattern.sub(replacement, cleaned)

        cleaned = self._MULTISPACE.sub(" ", cleaned)
        cleaned = self._MULTINEWLINE.sub("\n\n", cleaned)
        cleaned = cleaned.strip()

        if len(cleaned) < 100:
            warnings.append("Extracted text is very short; parsing quality may be reduced.")

        ocr_noise_ratio = self._estimate_ocr_noise(cleaned)
        if ocr_noise_ratio > 0.08:
            warnings.append(
                "Possible OCR noise detected in extracted text; LLM will attempt correction."
            )

        return cleaned, warnings

    @staticmethod
    def _estimate_ocr_noise(text: str) -> float:
        if not text:
            return 0.0
        suspicious = sum(1 for ch in text if ch in "|{}[]~`^")
        return suspicious / max(len(text), 1)
