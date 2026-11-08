#!/usr/bin/env python3
"""Search examples/catalog.json for README-hero references."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "examples" / "catalog.json"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--industry")
    ap.add_argument("--category")
    ap.add_argument("--has-animation", choices=("true", "false"))
    ap.add_argument("--tag")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--format", choices=("paths", "json"), default="json")
    args = ap.parse_args()

    if not CATALOG.is_file():
        print("search_examples: missing catalog", file=sys.stderr)
        raise SystemExit(1)

    examples = json.loads(CATALOG.read_text(encoding="utf-8")).get("examples", [])
    hits = []
    for ex in examples:
        if args.industry and ex.get("industry") != args.industry:
            continue
        if args.category and ex.get("category") != args.category:
            continue
        if args.has_animation == "true" and not ex.get("has_animation"):
            continue
        if args.has_animation == "false" and ex.get("has_animation"):
            continue
        if args.tag and args.tag not in ex.get("tags", []):
            continue
        hits.append(ex)

    if args.summary:
        print(f"{len(hits)} example(s)")
        for ex in hits:
            print(f"  {ex['id']}: {ex.get('product_story', '')[:60]}")
        raise SystemExit(0)

    if args.format == "paths":
        for ex in hits:
            for key in ("logo", "icon", "logo_animated", "icon_animated"):
                p = ex.get("paths", {}).get(key)
                if p:
                    print(ROOT / p)
    else:
        print(json.dumps(hits, indent=2))


if __name__ == "__main__":
    main()
