# Banner layout: column 3 and library samples

The README banner is always **904×256**, three columns: **mark** (`x≈28`), **copy** (`x≈184`), **story card** (`x=456`, width `424`). See [svg-blueprints.md](svg-blueprints.md) for coordinates.

Column 3 is **not** always a git-style red/green diff. Pick a mode in the brief; default from repo type.

## Column 3 modes

| Mode | When | Column 3 content |
|------|------|------------------|
| **`diff-hunks`** | Devtools, VCS, diff/review, patch, CI on code | Terminal card with `-` / `+` rows using `--del` / `--add` ([token-table.md](token-table.md)) |
| **`product-card`** | App, API, platform, dashboard | Mock UI panel, screenshot frame, or “hero module” with accent borders — **no** required hunks |
| **`feature-summary`** | Libraries, skills, docs repos | Bullet or numbered list, tier chips, pipeline `brief → kit → audit` |
| **`metrics`** | Data, analytics, infra | 2–3 stat tiles or sparkline bars; semantic colors optional, not diff semantics |
| **`minimal`** | Strong wordmark, minimal story | Single line + one pill inside the card; flat surface only |

**Icon (column 1)** may include a **small** diff vignette only when mode is `diff-hunks` or the product metaphor is literally “patch/diff”. Otherwise use an original symbol (path, grid, letterform) — no mandatory mini red/green blocks.

Record the choice in [templates/logo-brief.md](../templates/logo-brief.md) → **Banner column 3 mode**.

## Semantic red/green

- **Required** only for `diff-hunks` mode (banner column 3 and matching icon vignette).
- **Optional** elsewhere; use `--accent`, `--fg`, `--muted` for hierarchy instead.
- When you do use hunks, keep `--del` / `--add` tokens even if brand accent is purple or teal ([token-table.md](token-table.md)).

Visual QA ([xml-and-qa-gate.md](xml-and-qa-gate.md)): score criterion **Semantic diff colors** as **N/A** when mode ≠ `diff-hunks`.

## Library SVGs as samples (study)

Use `library/svg/` for **scale, category, and composition reference** — not as the shipped mark.

| Allowed | Forbidden |
|---------|-----------|
| `search_library.py` / `gallery.html` to pick **reference slugs**; note them in the brief | Pasting library paths into `assets/icon.svg` or README embed |
| Copy slugs into `assets/kit/library-samples/{slug}.svg` for **concept sheet** or **tiles board** side-by-side | Tracing or lightly editing trademark geometry into deliverables |
| “Same visual weight as `gojek` / `stripe`” written in brief | Using SI `astro` slug when the brand is Astro (Indonesia) — see [library/REGIONS.md](../library/REGIONS.md) |

Workflow:

```bash
python3 scripts/search_library.py --category tech_company --region id --summary
# Optional collage inputs only:
mkdir -p assets/kit/library-samples
cp library/svg/gojek.svg assets/kit/library-samples/
python3 scripts/concept_sheet.py assets/kit/concepts/*.svg assets/kit/library-samples/*.svg --names "A" "B" "ref-gojek" ...
```

Final **four README assets** must be **original** geometry aligned to the target brief ([library/TRADEMARKS.md](../library/TRADEMARKS.md)).

## Examples in this repo

| Example | Column 3 mode | Notes |
|---------|---------------|--------|
| [examples/applydiff/](../examples/applydiff/) | `diff-hunks` | Teaching anti-patterns + fix |
| [examples/logo-kit-svg/](../examples/logo-kit-svg/) | `feature-summary` + narrative diff (skill story) | Diff rows optional storytelling, not a generic rule |
