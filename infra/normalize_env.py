#!/usr/bin/env python3
"""Normalize list-shaped variables in a dotenv file to valid JSON arrays."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

LIST_KEYS = frozenset({"CORS_ORIGINS", "ALLOWED_EXTENSIONS"})


def normalize_list_value(raw: str) -> str:
    value = raw.strip()
    if not value.startswith("["):
        return raw

    try:
        json.loads(value)
        return raw
    except json.JSONDecodeError:
        inner = value[1:-1].strip()
        if not inner:
            return "[]"
        items = [part.strip().strip('"').strip("'") for part in inner.split(",") if part.strip()]
        return json.dumps(items)


def normalize_env_file(path: Path) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    normalized: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in line:
            normalized.append(line)
            continue

        key, value = line.split("=", 1)
        if key in LIST_KEYS:
            normalized.append(f"{key}={normalize_list_value(value)}")
        else:
            normalized.append(line)

    path.write_text("\n".join(normalized) + "\n", encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(f"Usage: {sys.argv[0]} <path-to-env-file>")

    normalize_env_file(Path(sys.argv[1]))


if __name__ == "__main__":
    main()
