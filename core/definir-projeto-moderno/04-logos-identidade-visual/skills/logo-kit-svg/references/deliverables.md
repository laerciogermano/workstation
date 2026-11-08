# Deliverables map

Inspired by [logo-design-skill `docs/images`](https://github.com/kaankiziltug/logo-design-skill/tree/main/docs/images) (hero, tiles, concept boards). This skill splits **base** (always) vs **additional** (user opt-in).

**This skill repo** keeps its own shipment under `examples/logo-kit-svg/` (README embed + `kit/`). Paths below use `assets/` for **target repos** the agent runs against.

## Base template (mandatory)

Written to the target repo `assets/`:

| File | Size | Role |
|------|------|------|
| `icon.svg` | 512×512 | Square mark |
| `icon-animated.svg` | 512×512 | Animated mark |
| `logo.svg` | 904×256 | README banner |
| `logo-animated.svg` | 904×256 | Animated banner |

README embed uses the two animated/static pair above.

## Additional kit (`assets/kit/`)

Generated for any **kit tier** (`lite` / `medium` / `full`). Orchestrate with `scripts/kit_build.py`; gate with `scripts/validate_kit.py`.

| Artifact | Tier | Script | Typical path |
|----------|------|--------|----------------|
| **Mono / reversed** | lite+ | `export_variants.py` | `assets/kit/icon-mono.svg`, `icon-reversed.svg` |
| **Platform pack** | **lite+ (required)** | `export_platform_icons.py` | `assets/kit/platform/` — [platform-icon-contracts.md](platform-icon-contracts.md): iOS `AppIcon.appiconset`, Android `mipmap-*` adaptive layers, web manifest, shape preview HTML |
| **Social cards** | **lite+ (required)** | `social_cards.py --png` | `assets/kit/social/*.svg` **and** matching `.png` |
| **Concept sheet** | medium+ | `concept_sheet.py` | `assets/kit/concept-sheet.svg` |
| **Tiles board** | medium+ | `tiles_board.py` | `tiles-board-directions.svg`, `tiles-board.svg` |
| **Preview sheet** | medium+ | `preview_sheet_lite.py --kit-dir assets/kit` | `preview_sheet_lite.html` (concepts + platform + social) |
| **Presentation board** | full | `presentation_board.py` | `presentation-board.html` |
| **Wordmark (type only)** | medium+ | hand-authored | `assets/kit/wordmark.svg` |

## Social / marketing cards (`assets/kit/social/`)

**Required for every kit** (SVG source + PNG export). Not part of the four README SVGs — for Open Graph, X/Twitter, GitHub social preview, square promo.

| File | ViewBox | Typical use |
|------|---------|-------------|
| `og-image.svg` | 1200×630 | Open Graph / generic link preview |
| `twitter-card.svg` | 1200×630 | X/Twitter summary (same layout as OG; duplicate file for upload clarity) |
| `github-social-preview.svg` | 1280×640 | GitHub repository social image |
| `square-1080.svg` | 1080×1080 | Instagram-style square |

Layout: icon left, **title + tagline** or **banner** on the right; `--theme-bg` / `--theme-fg` from the brief tokens.

```bash
python3 scripts/social_cards.py --icon assets/icon.svg --title "<Brand>" --tagline "<=32 chars>" \\
  --theme-bg "<--bg>" --theme-fg "<--fg>"

# Or horizontal logo instead of title text:
python3 scripts/social_cards.py --icon assets/icon.svg --banner assets/logo.svg --tagline "…" --png
```

PNG siblings (`og-image.png`, …) only when `--png` is passed (uses `render_png.py`; needs `rsvg-convert` or ImageMagick).

## Artifact → script → path (agent map)

Use this table when generating kit outputs; paths are relative to the **target repo** root.

| Artifact | Script | Typical CLI | Default output |
|----------|--------|-------------|----------------|
| Concept sheet (3 directions) | `scripts/concept_sheet.py` | `python3 scripts/concept_sheet.py assets/kit/concepts/*.svg --names "A" "B" "C" --notes "…" "…" "…" --recommend 2` | `assets/kit/concept-sheet.svg` |
| Tiles board (checkpoint 3-up) | `scripts/tiles_board.py` | `python3 scripts/tiles_board.py --title "Directions" --marks assets/kit/concepts/*.svg --names "…" "…" "…" --recommend 2` | `assets/kit/tiles-board.svg` |
| Tiles board (final size ladder) | `scripts/tiles_board.py` | `python3 scripts/tiles_board.py --title "Final marks" --icon assets/icon.svg --banner assets/logo.svg` | `assets/kit/tiles-board.svg` (overwrite or `-o assets/kit/tiles-board-final.svg`) |
| Presentation board | `scripts/presentation_board.py` | `python3 scripts/presentation_board.py templates/presentation-spec.json` | `assets/kit/presentation-board.html` |
| Preview sheet | `scripts/preview_sheet_lite.py` | `python3 scripts/preview_sheet_lite.py --icon assets/icon.svg --banner assets/logo.svg` | `assets/kit/preview_sheet_lite.html` |
| Social cards | `scripts/social_cards.py` | `python3 scripts/social_cards.py --icon assets/icon.svg --title "…" --tagline "…" --theme-bg "#…" --theme-fg "#…"` | `assets/kit/social/og-image.svg`, `twitter-card.svg`, `github-social-preview.svg`, `square-1080.svg` |

Concept drafts live in `assets/kit/concepts/` (`concept-a.svg`, …). Run **concept sheet** and/or **tiles board** at the explore checkpoint before the four README assets.

## Optional: `docs/images/` gallery (logo-design-skill parity)

When the user wants a **publishable README gallery** (like [logo-design-skill `docs/images`](https://github.com/kaankiziltug/logo-design-skill/tree/main/docs/images)), keep SVG sources in `assets/kit/` and add PNGs under the target repo:

| logo-design pattern | logo-kit-svg source | Suggested PNG path |
|---------------------|----------------------|--------------------|
| `{slug}-concepts.png` | `assets/kit/concept-sheet.svg` | `docs/images/<slug>-concepts.png` |
| `{slug}-board.png` | `assets/kit/tiles-board.svg` (checkpoint or final) | `docs/images/<slug>-board.png` |
| `tiles/*.png` | individual concept marks or ladder frames | `docs/images/tiles/<slug>-*.png` |
| `hero.png` | `assets/logo.svg` or animated still | `docs/images/hero.png` |

`<slug>` = repo or brand kebab-case (e.g. `applydiff`, `bramble-vet`). Ask once at checkpoint: **“Copy kit PNGs to `docs/images/` for README gallery?”** — default **skip** unless they reference logo-design-style docs or a public skill README.

Rasterize with `scripts/render_png.py` (requires `rsvg-convert` or ImageMagick):

```bash
python3 scripts/render_png.py assets/kit/concept-sheet.svg -o docs/images/<slug>-concepts.png -w 1200
python3 scripts/render_png.py assets/kit/tiles-board.svg -o docs/images/<slug>-board.png -w 1200
python3 scripts/render_png.py assets/logo.svg -o docs/images/hero.png -w 904
```

Commit `docs/images/*.png` only when the user opted in; do not replace the four live README SVG embeds in `assets/`.

## Checkpoint questions (decisions)

After concepts, ask in one message (with recommendations):

1. Direction **1 / 2 / 3**?
2. Kit tier **lite / medium / full**?
3. **Preview artifacts:** none | concept sheet | tiles board | both | + presentation (full)?
4. **Gallery publish:** skip (default) | copy kit PNGs to **`docs/images/`**?

**Platform + social are always generated** for kit (`export_platform_icons.py`, `social_cards.py --png`); validate with `validate_kit.py`. Default tier **lite**; explore adds concept/tiles previews; gallery still opt-in.

## Interrogate scope

When running **`interrogate`**, include opted-in `assets/kit/*` and platform PNGs in the review bundle—not only the four base SVGs.
