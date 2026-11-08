#!/usr/bin/env python3
"""Load macro → market region expansions from library/regions.json."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGIONS_FILE = ROOT / "library" / "regions.json"


def load_macro_regions() -> dict[str, list[str]]:
    if not REGIONS_FILE.is_file():
        return {}
    data = json.loads(REGIONS_FILE.read_text(encoding="utf-8"))
    raw = data.get("macro_regions", {})
    return {k.lower(): [c.lower() for c in v] for k, v in raw.items()}


def expand_macro(name: str) -> list[str]:
    macros = load_macro_regions()
    key = name.lower()
    if key not in macros:
        known = ", ".join(sorted(macros))
        raise ValueError(f"unknown macro region '{name}' (known: {known})")
    return macros[key]
