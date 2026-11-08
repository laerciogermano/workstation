# Contributing to Logo Kit SVG

Agent-facing instructions stay in **English**. Example copy inside SVGs and briefs may use the product's real language.

## Source of truth

**Edit this directory only.** On disk the folder may still be named `repo-logo-svg` inside the monorepo (`src/own-skills/repo-logo-svg`); the canonical skill id is **`logo-kit-svg`**.

This repository is the **only** source of truth for the **logo-kit-svg** skill. Do not treat sibling folders or old skill ids as upstream mirrors.

## Prerequisites

- Python 3.9+ (stdlib only for validation)
- Optional for the full QA gate when editing SVGs: `xmllint`, `rsvg-convert` (see [references/xml-and-qa-gate.md](references/xml-and-qa-gate.md))

From the skill root:

```bash
python3 scripts/validate_skill.py
python3 -m unittest discover -s tests -q
python3 tools/smoke_test.py
```

All three must pass before you open a pull request.

## What to change where

| Change | Edit |
|---|---|
| Agent workflow or routing | [SKILL.md](SKILL.md), [references/process.md](references/process.md) |
| Kit tiers | [references/brand-kit-tiers.md](references/brand-kit-tiers.md) |
| Icon/banner coordinates | [references/svg-blueprints.md](references/svg-blueprints.md) |
| Animation timing | [references/animation-choreography.md](references/animation-choreography.md) |
| XML / PNG QA checklist | [references/xml-and-qa-gate.md](references/xml-and-qa-gate.md) |
| Library maintainer | [references/library-guide.md](references/library-guide.md), `library-slugs.txt`, `scripts/sync_library.py` |
| Pre-draw worksheet | [templates/logo-brief.md](templates/logo-brief.md) |
| Agent entrypoint | [SKILL.md](SKILL.md) (`name: logo-kit-svg`); optional slash [commands/logo-kit-svg.md](commands/logo-kit-svg.md) |
| Install docs / file tree | [README.md](README.md) |
| Skill self-brand (four SVGs + kit) | [examples/logo-kit-svg/](examples/logo-kit-svg/) only — no root `assets/` |

## Reference library

```bash
python3 scripts/sync_library.py --clone   # optional; network
python3 scripts/build_catalog.py          # catalog.json, classifications.json, stats.json, gallery.html
```

Commit curated SVGs under `library/svg/` so CI stays offline. **Simple Icons:** `library-slugs.txt` + `sync_library.py`. **Peer shelf:** `library-slugs-logo-design.txt` (manual import from [logo-design-skill `assets/library`](https://github.com/kaankiziltug/logo-design-skill/tree/main/skills/logo-design/assets/library) — do not re-run `sync_library` for those slugs). Always run `build_catalog.py` after either path changes.

## Pull request expectations

- `python3 tools/smoke_test.py` passes.
- Plugin manifests under `.cursor-plugin/`, `.claude-plugin/`, `.codex-plugin/`, and `.agents/plugins/` stay consistent with [plugin.json](plugin.json) `name`.

## License

By contributing, you agree that your contributions are licensed under the same terms as the repository root [LICENSE](LICENSE).
