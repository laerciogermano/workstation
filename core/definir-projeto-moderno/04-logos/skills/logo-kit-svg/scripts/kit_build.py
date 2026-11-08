#!/usr/bin/env python3
"""Build the standard assets/kit/ tree (any tier): variants, platform, social, boards, HTML."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = sys.executable


def run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, cwd=ROOT)
    if proc.returncode != 0:
        raise SystemExit(proc.returncode)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--icon", type=Path, required=True)
    ap.add_argument("--banner", type=Path, required=True)
    ap.add_argument("--kit-dir", type=Path, required=True)
    ap.add_argument("--name", default="App")
    ap.add_argument("--theme-color", default="#12181f")
    ap.add_argument("--title", default="Brand")
    ap.add_argument("--tagline", default="")
    ap.add_argument("--presentation-spec", type=Path)
    ap.add_argument("--concepts", nargs="*", type=Path, default=[])
    ap.add_argument("--concept-names", nargs="*", default=[])
    ap.add_argument("--skip-concepts", action="store_true")
    args = ap.parse_args()

    kit = args.kit_dir
    kit.mkdir(parents=True, exist_ok=True)
    concepts_dir = kit / "concepts"
    concepts_dir.mkdir(parents=True, exist_ok=True)

    run([PY, "scripts/export_variants.py", "--src", str(args.icon), "--out-dir", str(kit)])
    run(
        [
            PY,
            "scripts/export_platform_icons.py",
            "--icon",
            str(args.icon),
            "--name",
            args.name,
            "--theme-color",
            args.theme_color,
            "--out-dir",
            str(kit / "platform"),
        ]
    )
    social_cmd = [
        PY,
        "scripts/social_cards.py",
        "--icon",
        str(args.icon),
        "--title",
        args.title,
        "--tagline",
        args.tagline,
        "--theme-bg",
        args.theme_color,
        "--theme-fg",
        "#eef2f6",
        "-o",
        str(kit / "social"),
        "--png",
    ]
    run(social_cmd)

    if not args.skip_concepts and args.concepts:
        names = args.concept_names or [f"C{i + 1}" for i in range(len(args.concepts))]
        run(
            [
                PY,
                "scripts/concept_sheet.py",
                *[str(p) for p in args.concepts],
                "--names",
                *names,
                "--recommend",
                "1",
                "-o",
                str(kit / "concept-sheet.svg"),
            ]
        )
        run(
            [
                PY,
                "scripts/tiles_board.py",
                "--title",
                "Directions",
                "--marks",
                *[str(p) for p in args.concepts],
                "--names",
                *names,
                "--recommend",
                "1",
                "-o",
                str(kit / "tiles-board-directions.svg"),
            ]
        )

    run(
        [
            PY,
            "scripts/tiles_board.py",
            "--title",
            args.title,
            "--icon",
            str(args.icon),
            "--banner",
            str(args.banner),
            "-o",
            str(kit / "tiles-board.svg"),
        ]
    )

    preview_cmd = [
        PY,
        "scripts/preview_sheet_lite.py",
        "--icon",
        str(args.icon),
        "--banner",
        str(args.banner),
        "--kit-dir",
        str(kit),
        "-o",
        str(kit / "preview_sheet_lite.html"),
    ]
    run(preview_cmd)

    if args.presentation_spec and args.presentation_spec.is_file():
        run(
            [
                PY,
                "scripts/presentation_board.py",
                str(args.presentation_spec),
                "-o",
                str(kit / "presentation-board.html"),
            ]
        )

    print(f"kit_build: OK → {kit}")


if __name__ == "__main__":
    main()
