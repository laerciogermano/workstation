#!/usr/bin/env python3
"""Verify README embeds the four-asset hero pattern."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SELF_EXAMPLE = "examples/logo-kit-svg"


def required_embeds(root: Path) -> list[str]:
    """Skill repo uses examples/logo-kit-svg; target repos use assets/."""
    skill_icon = root / SELF_EXAMPLE / "icon.svg"
    if skill_icon.is_file() and not (root / "assets" / "icon.svg").is_file():
        prefix = SELF_EXAMPLE
    else:
        prefix = "assets"
    return [f"{prefix}/logo-animated.svg", f"{prefix}/icon.svg"]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--readme", type=Path, default=ROOT / "README.md")
    ap.add_argument("--target-repo", action="store_true", help="Check target repo README (cwd)")
    args = ap.parse_args()

    readme = Path("README.md") if args.target_repo else args.readme
    if not readme.is_file():
        print(f"check_readme_embed: missing {readme}", file=sys.stderr)
        raise SystemExit(1)

    text = readme.read_text(encoding="utf-8")
    root = Path.cwd() if args.target_repo else ROOT
    required = required_embeds(root)
    missing = [s for s in required if s not in text]
    if missing:
        print(f"check_readme_embed: README must contain: {', '.join(missing)}", file=sys.stderr)
        raise SystemExit(1)
    print("check_readme_embed: OK")


if __name__ == "__main__":
    main()
