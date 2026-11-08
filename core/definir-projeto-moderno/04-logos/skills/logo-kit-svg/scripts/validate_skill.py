#!/usr/bin/env python3
"""Layout and link checks for the logo-kit-svg skill."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_PATHS = [
    "SKILL.md",
    "README.md",
    "LICENSE",
    "CONTRIBUTING.md",
    "plugin.json",
    ".cursor-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    ".codex-plugin/plugin.json",
    ".agents/plugins/marketplace.json",
    "references/svg-blueprints.md",
    "references/animation-choreography.md",
    "references/xml-and-qa-gate.md",
    "references/process.md",
    "references/brand-kit-tiers.md",
    "references/library-guide.md",
    "references/context-gathering.md",
    "references/deliverables.md",
    "references/banner-column-3.md",
    "references/token-table.md",
    "references/brand-strategy-and-board.md",
    "templates/logo-brief.md",
    "templates/grill-round.md",
    "templates/brand-guidelines.md",
    "templates/presentation-spec.example.json",
    "commands/logo-kit-svg.md",
    "commands/mark-kit-svg.md",
    "examples/logo-kit-svg/profile.svg",
    "examples/logo-kit-svg/icon.svg",
    "examples/logo-kit-svg/logo-animated.svg",
    "library/TRADEMARKS.md",
    "library/taxonomy.json",
    "library/catalog.json",
    "library/classifications.json",
    "library/stats.json",
    "library/gallery.html",
    "library/REGIONS.md",
    "library/regions.json",
    "examples/catalog.json",
    "library-slugs.txt",
    "library-slugs-logo-design.txt",
    "evals/evals.json",
    "tools/smoke_test.py",
    ".github/workflows/test.yml",
    "scripts/svglib_repo.py",
    "scripts/svg_audit_repo_logo.py",
    "scripts/render_qa.py",
    "scripts/check_readme_embed.py",
    "scripts/search_library.py",
    "scripts/region_macros.py",
    "scripts/search_examples.py",
    "scripts/build_catalog.py",
    "scripts/sync_library.py",
    "scripts/export_variants.py",
    "scripts/preview_sheet_lite.py",
    "scripts/concept_sheet.py",
    "scripts/presentation_board.py",
    "scripts/tiles_board.py",
    "scripts/export_platform_icons.py",
    "scripts/platform_contracts.py",
    "references/platform-icon-contracts.md",
    "scripts/render_png.py",
    "scripts/social_cards.py",
    "scripts/kit_build.py",
    "scripts/validate_kit.py",
    "examples/applydiff/icon.svg",
    "examples/applydiff/logo-animated.svg",
]

SKILL_LINK_RE = re.compile(r"\]\(([^)#]+)\)")
APPLYDIFF_SVGS = sorted((ROOT / "examples" / "applydiff").glob("*.svg"))


def _fail(message: str) -> None:
    print(f"validate_skill: {message}", file=sys.stderr)
    raise SystemExit(1)


def check_required_files() -> None:
    missing = [rel for rel in REQUIRED_PATHS if not (ROOT / rel).is_file()]
    if missing:
        _fail("missing files:\n  " + "\n  ".join(missing))
    lib_svg = list((ROOT / "library" / "svg").glob("*.svg"))
    if len(lib_svg) < 75:
        _fail(f"library/svg needs curated SVGs (found {len(lib_svg)}, expected >= 75; run sync_library.py)")


def check_skill_frontmatter() -> None:
    text = (ROOT / "SKILL.md").read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        _fail("SKILL.md must start with YAML frontmatter")
    if "name: logo-kit-svg" not in text.split("---", 2)[1]:
        _fail("SKILL.md frontmatter must set name: logo-kit-svg")


def check_skill_links() -> None:
    text = (ROOT / "SKILL.md").read_text(encoding="utf-8")
    for target in SKILL_LINK_RE.findall(text):
        if target.startswith(("http://", "https://", "mailto:")):
            continue
        path = (ROOT / target).resolve()
        try:
            path.relative_to(ROOT.resolve())
        except ValueError:
            _fail(f"SKILL.md link escapes skill root: {target}")
        if not path.is_file():
            _fail(f"broken SKILL.md link: {target}")


def check_applydiff_audit() -> None:
    audit = ROOT / "scripts" / "svg_audit_repo_logo.py"
    if not APPLYDIFF_SVGS:
        return
    proc = subprocess.run(
        [sys.executable, str(audit), *[str(p) for p in APPLYDIFF_SVGS]],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        _fail("applydiff example SVGs failed svg_audit_repo_logo.py:\n" + (proc.stderr or proc.stdout))


def main() -> None:
    check_required_files()
    check_skill_frontmatter()
    check_skill_links()
    check_applydiff_audit()
    print("validate_skill: OK")


if __name__ == "__main__":
    main()
