---
description: Ship icon + README banner SVGs (plain + animated) and optional brand kit from real theme tokens — follow logo-kit-svg SKILL.md end to end.
---

# /logo-kit-svg

Run the **logo-kit-svg** skill in this repo ([SKILL.md](../SKILL.md)). Do not improvise the workflow.

**Typical ask:** plain + animated SVG brand for the README — `assets/icon.svg`, `icon-animated.svg`, `logo.svg`, `logo-animated.svg` — plus optional `assets/kit/` tier (`lite` | `medium` | `full`).

**Modes:** `one_shot` (default) · `explore` (three concepts + checkpoint) · `mark_only` (`assets/brand-mark.svg` supplied).

**Args (optional):** `lite` / `medium` / `full` · `--explore` · gallery `docs/images/` opt-in — **platform (iOS/Android PNG) + social (SVG+PNG) are required for every kit** — see [references/deliverables.md](../references/deliverables.md).

**QA (mandatory before done):** `svg_audit_repo_logo.py`, `render_qa.py`, `check_readme_embed.py` — [references/xml-and-qa-gate.md](../references/xml-and-qa-gate.md).

**This skill repo’s own brand** lives under `examples/logo-kit-svg/`, not root `assets/`.
