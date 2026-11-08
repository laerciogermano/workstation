#!/usr/bin/env python3
"""Search library/catalog.json with AND filters."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "library" / "catalog.json"


def matches(entry: dict, filters: dict[str, str], region_in: set[str] | None = None) -> bool:
    if region_in is not None:
        if entry.get("region") not in region_in:
            return False
    for key, val in filters.items():
        if key == "region":
            continue
        if entry.get(key) != val:
            return False
    return True


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--category")
    ap.add_argument("--mark-type", dest="mark_type")
    ap.add_argument("--geometry")
    ap.add_argument("--color-family", dest="color_family")
    ap.add_argument("--slug")
    ap.add_argument(
        "--region",
        help="Market tag from taxonomy-overrides (e.g. id, eu, us); see library/REGIONS.md",
    )
    ap.add_argument(
        "--macro",
        help="Sales/macro region; expands via library/regions.json (e.g. emea, apj, asean)",
    )
    ap.add_argument("--industry", help="Industry tag from taxonomy-overrides (e.g. automotive)")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--format", choices=("paths", "json"), default="paths")
    args = ap.parse_args()

    if not CATALOG.is_file():
        print("search_library: run scripts/build_catalog.py first", file=sys.stderr)
        raise SystemExit(1)

    if args.region and args.macro:
        print("search_library: use --region or --macro, not both", file=sys.stderr)
        raise SystemExit(2)

    region_in: set[str] | None = None
    if args.macro:
        scripts_dir = Path(__file__).resolve().parent
        if str(scripts_dir) not in sys.path:
            sys.path.insert(0, str(scripts_dir))
        from region_macros import expand_macro

        region_in = set(expand_macro(args.macro))
    elif args.region:
        region_in = {args.region.lower()}

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    filters = {k: v for k, v in {
        "category": args.category,
        "mark_type": args.mark_type,
        "geometry": args.geometry,
        "color_family": args.color_family,
        "slug": args.slug,
        "region": args.region,
        "industry": args.industry,
    }.items() if v}

    hits = [e for e in catalog.get("entries", []) if matches(e, filters, region_in)]

    if args.summary:
        extra = ""
        if region_in is not None:
            extra = f" region_in={sorted(region_in)}"
        print(f"{len(hits)} match(es)" + (f" filters={filters}" if filters else "") + extra)
        for e in hits[:12]:
            print(f"  {e['slug']}: {e.get('category')} / {e.get('mark_type')}")
        if len(hits) > 12:
            print(f"  ... +{len(hits) - 12} more")
        raise SystemExit(0)

    if args.format == "json":
        print(json.dumps(hits, indent=2))
    else:
        for e in hits:
            print(ROOT / e["path"])


if __name__ == "__main__":
    main()
