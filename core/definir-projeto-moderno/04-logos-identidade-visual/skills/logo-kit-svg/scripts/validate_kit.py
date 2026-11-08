#!/usr/bin/env python3
"""Verify mandatory kit/ artifacts (platform iOS+Android PNG, social SVG+PNG)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

LITE = [
    "icon-mono.svg",
    "icon-reversed.svg",
    "platform/platform-shape-preview.html",
    "platform/web/favicon.ico",
    "platform/web/favicon-32x32.png",
    "platform/web/site.webmanifest",
    "platform/ios/apple-touch-icon.png",
    "platform/ios/AppIcon.appiconset/icon-1024.png",
    "platform/ios/AppIcon.appiconset/icon-180.png",
    "platform/ios/AppIcon.appiconset/Contents.json",
    "platform/android/play-store-icon.png",
    "platform/android/adaptive-icon.xml",
    "platform/android/mipmap-xxxhdpi/ic_launcher_foreground.png",
    "platform/android/mipmap-xxxhdpi/ic_launcher_background.png",
    "platform/android/mipmap-xxxhdpi/ic_launcher.png",
    "platform/android/android-chrome-192x192.png",
    "platform/android/android-chrome-512x512.png",
    "social/og-image.svg",
    "social/og-image.png",
    "social/github-social-preview.svg",
    "social/github-social-preview.png",
    "social/twitter-card.svg",
    "social/twitter-card.png",
    "social/square-1080.svg",
    "social/square-1080.png",
]

MEDIUM_EXTRA = [
    "concept-sheet.svg",
    "tiles-board.svg",
    "preview_sheet_lite.html",
]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kit-dir", type=Path, required=True)
    ap.add_argument("--tier", choices=("lite", "medium", "full"), default="medium")
    ap.add_argument("--require-presentation", action="store_true", help="full tier (alias: --tier full)")
    args = ap.parse_args()

    tier = "full" if args.require_presentation else args.tier
    required = list(LITE)
    if tier in ("medium", "full"):
        required.extend(MEDIUM_EXTRA)
    if tier == "full":
        required.append("presentation-board.html")

    kit = args.kit_dir
    missing = [rel for rel in required if not (kit / rel).is_file()]

    if missing:
        print("validate_kit: missing:", file=sys.stderr)
        for m in missing:
            print(f"  {m}", file=sys.stderr)
        raise SystemExit(1)
    print("validate_kit: OK")


if __name__ == "__main__":
    main()
