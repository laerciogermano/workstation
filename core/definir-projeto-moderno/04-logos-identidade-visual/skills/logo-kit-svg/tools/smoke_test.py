#!/usr/bin/env python3
"""CI smoke: validate_skill + audit examples + optional render_qa."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, cwd=ROOT)
    if proc.returncode != 0:
        raise SystemExit(proc.returncode)


def main() -> None:
    py = sys.executable
    run([py, "scripts/validate_skill.py"])
    run([py, "-m", "unittest", "discover", "-s", "tests", "-q"])

    applydiff = sorted((ROOT / "examples" / "applydiff").glob("*.svg"))
    if applydiff:
        run([py, "scripts/svg_audit_repo_logo.py", *[str(p) for p in applydiff]])

    render = ROOT / "scripts" / "render_qa.py"
    if render.is_file():
        proc = subprocess.run(
            [
                py,
                str(render),
                "--icon",
                str(ROOT / "examples" / "applydiff" / "icon.svg"),
                "--banner",
                str(ROOT / "examples" / "applydiff" / "logo.svg"),
            ],
            cwd=ROOT,
        )
        if proc.returncode not in (0,):
            print("smoke_test: render_qa failed", file=sys.stderr)
            raise SystemExit(proc.returncode)

    example_kit = ROOT / "examples" / "logo-kit-svg" / "kit"
    validate_kit = ROOT / "scripts" / "validate_kit.py"
    if example_kit.is_dir() and validate_kit.is_file():
        run(
            [
                py,
                str(validate_kit),
                "--kit-dir",
                str(example_kit),
                "--tier",
                "full",
            ]
        )

    print("smoke_test: OK")


if __name__ == "__main__":
    main()
