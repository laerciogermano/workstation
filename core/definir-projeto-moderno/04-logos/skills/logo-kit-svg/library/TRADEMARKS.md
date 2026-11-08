# Trademark and study-only policy

SVG files under `library/svg/` come from two **study-only** sources:

| Source | Slugs | License / notes |
|--------|-------|-----------------|
| [Simple Icons](https://github.com/simple-icons/simple-icons) | Curated list in `library-slugs.txt` | MIT on the **files**; trademarks of each owner |
| [logo-design-skill](https://github.com/kaankiziltug/logo-design-skill) (`kaankiziltug/logo-design-skill`) | Peer reference imports in `library-slugs-logo-design.txt` | Same study-only rule; **not** Simple Icons — use for scale/style shelf density, never paste into deliverables |

Each icon remains a **registered trademark** of its owner regardless of file source.

## Rules for agents and humans

1. **Study only** — use the library for shelf tests, category research, and cliché avoidance. Do not trace, paste, or lightly remix trademark shapes into client deliverables.
2. **No redistribution as brand assets** — do not ship library SVGs as the user's logo, favicon, or README hero.
3. **Our deliverables** — the four README assets (`icon.svg`, `logo.svg`, animated twins) must be original geometry aligned to the target repo's brief and theme tokens.
4. **Sync is optional** — `scripts/sync_library.py` pulls **Simple Icons** only (`library-slugs.txt`). logo-design-skill imports are copied manually; do not run `sync_library` for those slugs.
5. **Dual library** — Simple Icons (`library-slugs.txt`) plus logo-design-skill peer imports (`library-slugs-logo-design.txt`). Counts by source live in `stats.json` after `build_catalog.py`. Overrides use `"source": "simple-icons"` or `"source": "logo-design-skill"` per slug.

When in doubt, run `search_library.py --summary` for references, then design a new mark that passes the semantic diff story in [references/svg-blueprints.md](../references/svg-blueprints.md).

## Sports and club marks (extra sensitivity)

Football clubs, leagues, and athletic brands are **among the most aggressively enforced trademarks**. Simple Icons includes some **leagues and apparel brands** (see `sports_brand` / `sports_league` in `taxonomy.json`) but **not** most individual football clubs (e.g. Chelsea FC, Persija Jakarta, Persib Bandung).

| Kind | In this repo today | How to extend |
|------|-------------------|---------------|
| Leagues / federations / apparel (SI slug) | `library-slugs.txt` + `sync_library.py` | Add slug, override category in `taxonomy-overrides.json` |
| Club crests (not on Simple Icons) | Documented in `$manual_study_gaps` in `taxonomy-overrides.json` | **Manual study SVG** only (see below) |

**Never** scrape random web logos into the repo without a clear license and an entry in this file.

### Manual study SVG workflow (clubs not on Simple Icons)

1. Confirm the mark is **not** on Simple Icons (`slugs.md` upstream).
2. Obtain a reference file you are allowed to use for **local study** (your own trace, press kit with explicit permission, or CC-licensed asset — document the source).
3. Save as `library/svg/<slug>.svg` using the slug from `$manual_study_gaps` (e.g. `persijajakarta.svg`).
4. Add or update `taxonomy-overrides.json` for that slug with `"source": "manual-study"` and `category: sports_club`, plus a one-line `license_note` in the override if needed.
5. Run `python3 scripts/build_catalog.py` and re-read this section before any deliverable work.

Listed gaps (no committed SVG until you add one): see `manual_study_gaps` in [stats.json](stats.json) (generated from `$manual_study_gaps`).

## Simple Icons gaps (major brands)

Some widely searched dev brands are **not** in Simple Icons (removed or never added): e.g. OpenAI, Microsoft, Azure, AWS, Slack, Heroku, Playwright. Prefer nearby shelf marks (e.g. `metaai`, `googlecloud`, `githubactions`) or manual study with the same rules as clubs.
