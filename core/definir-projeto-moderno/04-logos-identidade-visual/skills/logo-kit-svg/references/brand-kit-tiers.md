# Brand kit tiers

User picks **lite**, **medium**, or **full** after concepts (or once in one_shot if not stated). **Base four README SVGs** in `assets/` are always required — see [deliverables.md](deliverables.md).

**Every kit tier** (lite and above) must ship **platform** (iOS + Android PNGs) and **social** (SVG + PNG). Run `scripts/kit_build.py` or the individual exporters, then `scripts/validate_kit.py`.

| Tier | Deliverables under `assets/kit/` |
|------|----------------------------------|
| **lite** | Mono/reversed + **platform/** per [platform-icon-contracts.md](platform-icon-contracts.md) (Android adaptive `mipmap-*`, iOS `AppIcon.appiconset`, web manifest) + **social/** (`.svg` + `.png`) |
| **medium** | lite + `preview_sheet_lite.html` (must embed concepts, platform, social) + **concept-sheet.svg** + **tiles-board-directions.svg** + **tiles-board.svg** |
| **full** | medium + `presentation-board.html` from `presentation_board.py` |

Board composition for medium/full artifacts (concept sheet, tiles boards, presentation board, and any user-requested brand-kit board SVG) follows the rhythm and panel discipline in [brand-strategy-and-board.md](brand-strategy-and-board.md) §4: vary quiet/functional/emotional/technical/atmospheric/detailed panels, keep text within the §5 budget, and reuse the identical shipped mark in every panel. This adds no new mandatory tier files.

### One-shot build

```bash
python3 scripts/kit_build.py \
  --icon assets/icon.svg --banner assets/logo.svg --kit-dir assets/kit \
  --name "<Brand>" --theme-color "<--bg>" --title "<Brand>" --tagline "<tagline>" \
  --presentation-spec templates/presentation-spec.example.json \
  --concepts assets/kit/concepts/*.svg --concept-names "A" "B" "C"
python3 scripts/validate_kit.py --kit-dir assets/kit
# full tier:
python3 scripts/validate_kit.py --kit-dir assets/kit --require-presentation
```

### Preview artifacts

| Artifact | Script | Typical file |
|----------|--------|----------------|
| Concept sheet | `concept_sheet.py` | `concept-sheet.svg` (marks **inlined** as nested `<svg>` — no external `<image href>`) |
| Tiles board (3-up) | `tiles_board.py --marks …` | `tiles-board-directions.svg` |
| Tiles board (final) | `tiles_board.py --icon --banner` | `tiles-board.svg` |
| Preview sheet | `preview_sheet_lite.py --kit-dir assets/kit` | `preview_sheet_lite.html` |
| Presentation board | `presentation_board.py` | `presentation-board.html` |

**Optional gallery** (user opt-in): PNG copies under `docs/images/` via `render_png.py` — [deliverables.md](deliverables.md).

### Platform pack (required for every kit)

```bash
python3 scripts/export_platform_icons.py --icon assets/icon.svg --name "<Brand>" --theme-color "<#from --bg>"
```

Outputs `assets/kit/platform/` — **`web/`** (favicon + manifest), **`android/`**, **`ios/`** (no duplicate PNGs at platform root).

### Social cards (required for every kit)

```bash
python3 scripts/social_cards.py --icon assets/icon.svg --title "<Brand>" --tagline "…" \\
  --theme-bg "<--bg>" --theme-fg "<--fg>" -o assets/kit/social --png
```

Must emit **both** `.svg` and `.png` for `og-image`, `twitter-card`, `github-social-preview`, `square-1080`.
