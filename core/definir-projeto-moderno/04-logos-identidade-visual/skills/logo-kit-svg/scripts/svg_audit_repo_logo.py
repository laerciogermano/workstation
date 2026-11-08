#!/usr/bin/env python3
"""Audit logo-kit-svg deliverable SVGs against skill rules."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import svglib_repo as lib  # noqa: E402


def audit_file(path: Path) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    name = path.name

    def add(level: str, code: str, message: str) -> None:
        findings.append({"level": level, "code": code, "message": message, "file": name})

    try:
        raw, root = lib.load_svg(path)
    except Exception as exc:
        add("FAIL", "parse", f"Cannot parse SVG: {exc}")
        return findings

    if "<script" in raw.lower():
        add("FAIL", "script", "Contains <script> (forbidden for GitHub-safe SVG).")

    if lib.invalid_xml_comments(raw):
        add("FAIL", "xml-comment", "Invalid XML comment (contains '--' inside comment body).")

    for snippet in lib.find_raw_utf8_in_text(raw):
        add("FAIL", "raw-utf8", f"Raw UTF-8 punctuation in <text>: {snippet!r}")

    vb = lib.parse_viewbox(root)
    if vb is None:
        add("WARN", "no-viewbox", "Missing viewBox.")
    elif name.startswith("icon"):
        if not lib.viewbox_matches(vb, lib.ICON_VIEWBOX):
            add("FAIL", "viewbox-icon", f"Icon viewBox must be 0 0 512 512, got {vb}.")
    elif name.startswith("logo"):
        if not lib.viewbox_matches(vb, lib.BANNER_VIEWBOX):
            add("FAIL", "viewbox-banner", f"Banner viewBox must be 0 0 904 256, got {vb}.")

    if "animated" in name and not lib.has_reduced_motion_media(raw):
        add("FAIL", "reduced-motion", "Animated SVG must include prefers-reduced-motion media query.")

    counts = lib.element_counts(root)
    if counts.get("script", 0):
        add("FAIL", "script-tag", "Contains <script> element.")

    if lib.stripe_heuristic(raw) and name.startswith("logo"):
        add("WARN", "stripe-pattern", "Possible scanline/stripe pattern detected.")

    return findings


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("paths", nargs="+", type=Path)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    all_findings: list[dict[str, str]] = []
    for p in args.paths:
        if not p.is_file():
            all_findings.append(
                {"level": "FAIL", "code": "missing", "message": f"File not found: {p}", "file": str(p)}
            )
            continue
        all_findings.extend(audit_file(p))

    fails = [f for f in all_findings if f["level"] == "FAIL"]
    if args.json:
        print(json.dumps({"findings": all_findings, "ok": not fails}, indent=2))
    else:
        for f in all_findings:
            print(f"{f['level']:4s} [{f['code']}] {f['file']}: {f['message']}")
        if fails:
            print(f"\n{len(fails)} failure(s).", file=sys.stderr)
    raise SystemExit(1 if fails else 0)


if __name__ == "__main__":
    main()
