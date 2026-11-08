---
name: logo-kit-svg
description: Ship a four-file SVG brand system (icon + README banner, static + animated) plus tiered kit. Every kit includes platform PNGs (iOS + Android) and social cards (SVG + PNG); medium+ adds concept/tiles/preview; full adds presentation board. Script-enforced QA via validate_kit.py.
---

# Logo Kit SVG (icon + banner + kit)

Phased workflow: **context → grill (when needed) → brief → research → concepts → (checkpoint) → brand kit tier → four README assets → adversarial pass → script QA**.

For generic doc/plan grilling without SVG deliverables, hand off to `super-challenge-me` instead of duplicating it here.

Companion for identity-only exploration: [logo-design-skill](https://github.com/kaankiziltug/logo-design-skill) (study marks); this skill owns the **fixed 904×256 README blueprint** and four deliverable files.

## Router (read first)

| Mode | Trigger | Checkpoint |
|------|---------|------------|
| **one_shot** (default) | “logo for this repo”, theme file present | Skip concept pause; **ask kit tier once** if not stated (default `lite`) |
| **explore** | “directions”, “concepts”, “three options”, empty brand | Stop after concept summary; require pick + kit tier |
| **mark_only** | User supplies `assets/brand-mark.svg` | Skip concepting for column-1; still run kit + 4 assets |

Checkpoint rules: [references/process.md](references/process.md). **Base vs additional outputs:** [references/deliverables.md](references/deliverables.md). Kit tiers: [references/brand-kit-tiers.md](references/brand-kit-tiers.md). **Strategy, metaphor, visual mode, and board rhythm (before concepts; for any board):** [references/brand-strategy-and-board.md](references/brand-strategy-and-board.md).

## Phase 0: Learn context (always)

Full rules: [references/context-gathering.md](references/context-gathering.md).

1. **Facts first** — Read `README.md`, theme files, and any path or URL the user gave (article, `CONTEXT.md`, ADR, internal doc). Grep for `--bg`, `--accent`, existing `assets/`. Large repo → run **`super-codebase-learner`**, then continue. **Approved-asset check:** if a `final/` folder, a user-named approved file, or a liked attachment exists, it outranks `assets/` drafts and `sample/` explorations for geometry, colour, copy, and animation — record the winning source in the brief ([references/brand-strategy-and-board.md](references/brand-strategy-and-board.md) §7).
2. **Record citations** in [templates/logo-brief.md](templates/logo-brief.md) (source file per token, doc links). Missing facts → **unknown — looked, not found** — never guess hex or tagline.
3. **Decisions second** — Only ask what facts cannot answer: kit tier, mode, concept pick, tone. One numbered question + **recommended answer** + why; wait (super-challenge-me cadence).
4. **Escalate peers when stuck** (invoke the skill; do not reimplement it here):
   - Thin idea / no positioning → `super-challenge-me` **brainstorm**
   - Stress-test assumptions on a draft brief → **grill** or **grill-docs** if domain docs exist
   - Scope / hidden work (icons in CI, LFS, npm package fields) → **challenge**
   - Multi-model review before ship → **`interrogate`** on `assets/*.svg` + brief + README embed (or self-pass with interrogate rubric lenses in context-gathering)

Do not start drawing until tokens and copy draft are grounded or explicitly assumed (one_shot).

## Grill & interrogate (single agent)

Use this **before** filling the brief when context is thin, copy is hand-wavy, or the user asks to grill, stress-test, challenge, or poke holes. This is **not** the pstack `interrogate` skill: **do not spawn Task/subagent reviewers** — one agent scopes, states intent, asks numbered questions, and waits.

### When to run

| Situation | Grill |
|-----------|-------|
| **explore** or ambiguous ask | Required — at least kit tier + mark direction |
| User says grill / challenge / stress-test | Required — pick **grill** or **grill-docs** below |
| **one_shot** with README + theme + exact copy | Skip questions; still write **Intent** in one paragraph |
| **mark_only** | Scope + intent only; grill column-1 story if terminal copy is still TBD |

### Step 1 — Scope

Identify what grounds the logo work:

- `README.md`, theme/token source ([references/token-table.md](references/token-table.md)), any `assets/` SVGs the user pointed at
- User message, command args (`--explore`, kit tier), and repo name vs display wordmark
- If they referenced recent edits, read those files — do not review via multi-model spawn

Package a short bullet list of sources you actually read (paths only).

### Step 2 — Intent

State **one paragraph**: what the four README assets should communicate, for whom, under which mode/tier, and which constraints are fixed (tokens, banner layout, trademark study-only). If intent is unclear, ask **one** clarifying question before research/concepts — do not start drawing.

### Step 3 — Grill the context

Pick a mode (do not announce the name unless the user asks):

| Mode | When |
|------|------|
| **grill** | Mark metaphor, copy layers, animation, kit depth, cliché avoidance |
| **grill-docs** | README/brand copy already exists — align wordmark, tagline, motto, and terminal narrative; cite file lines when correcting vocabulary |

**Rules (borrowed, trimmed):**

1. **Facts vs decisions** — Read the repo for colors, name, and positioning. Only the user decides taste and metaphor.
2. **Numbered question + recommended answer, then wait** — [templates/grill-round.md](templates/grill-round.md). Default one-at-a-time; batch only if they ask or several independent fields are empty on the brief worksheet.
3. **Attack the work, not the person.** After three obvious mark directions, add **one** non-obvious option, recommend, then wait.
4. **Stop** when [templates/logo-brief.md](templates/logo-brief.md) can be filled without guessing, or **one_shot** assumptions are stated and the user said ship.

Optional: if the thread will span sessions, summarize decisions in chat (wordmark split, chosen metaphor, kit tier, clichés) — no separate decision-map file unless the user asks.

## Non-negotiable rules

1. **Read real color tokens first** — [references/token-table.md](references/token-table.md); never invent a palette.
2. **Flat solid `--bg` only** — no scanline stripes or moving background sweeps.
3. **Always ship the base four in `assets/`** (additional kit files live in `assets/kit/` — see deliverables):
   - `assets/icon.svg` (`512×512`)
   - `assets/icon-animated.svg` (`512×512`, CSS only)
   - `assets/logo.svg` (`904×256` 3-column banner)
   - `assets/logo-animated.svg` (`904×256`)
4. **Full 3-column banner** — [references/svg-blueprints.md](references/svg-blueprints.md); never wordmark-only. Column 3 mode: [references/banner-column-3.md](references/banner-column-3.md) (`diff-hunks` only when the product story is diff/VCS/review).
5. **Semantic red/green hunks** — only when column 3 mode is `diff-hunks`; otherwise use accent/muted hierarchy without `-`/`+` rows.
6. **Pill width** — `chars × 7.2 + 32`; ≥24px gutter before column 3 (`x=456`).
7. **Library samples** — study `library/svg/` via search; optional copies under `assets/kit/library-samples/` for concept/tiles collages only — never paste library art into the four deliverables ([references/banner-column-3.md](references/banner-column-3.md), [library/TRADEMARKS.md](library/TRADEMARKS.md)).
8. **Render + visually inspect** — mandatory `render_qa.py` paths before done. Applies to boards and print surfaces (letterhead) too: render, read the PNG, then claim done.
9. **Final-asset precedence + replica fidelity** — an approved `final/` asset or liked attachment is the source of truth; replicate its geometry and animation faithfully, never silently substitute a similar mark or a different motion ([references/brand-strategy-and-board.md](references/brand-strategy-and-board.md) §7).
10. **Brand name ≠ legal name** — logos and public surfaces carry the brand name only; a legal entity name (e.g. `PT. …`) appears only as a small line on formal print (letterhead, invoice) and is read from a user document, never invented (§9 there).

## Phases

### 1. Discovery → brief

Complete **Scope, Intent, and grill** (above) when triggered. Then read `README.md` and theme files and fill [templates/logo-brief.md](templates/logo-brief.md) including **kit tier** (`lite` | `medium` | `full`), **library category**, **context sources** (files/docs cited in phase 0), and grill outcomes (mode, intent paragraph, clichés).

### 2. Research

```bash
python3 scripts/search_library.py --category oss_repo_mark --summary
python3 scripts/search_examples.py --has-animation true --summary
```

Skim [library/stats.json](library/stats.json) for category coverage; use [library/classifications.json](library/classifications.json) or [library/gallery.html](library/gallery.html) for visual/structured study (same artifact pattern as [logo-design-skill `assets/library`](https://github.com/kaankiziltug/logo-design-skill/tree/main/skills/logo-design/assets/library) — we use Simple Icons + our catalog, not their SVGs).

Document 3–5 clichés to avoid ([references/library-guide.md](references/library-guide.md)); pick **library reference slugs** for scale/composition (record in brief; optional `assets/kit/library-samples/` for concept boards — [references/banner-column-3.md](references/banner-column-3.md)). For sports/fan repos check `sports_*` and `manual_study_gaps` in [library/stats.json](library/stats.json). Study-only in deliverables — [library/TRADEMARKS.md](library/TRADEMARKS.md).

### 3. Concepts

**Strategy first** (explore/full/board, or whenever positioning is not already settled): fill the strategy + core-metaphor fields in the brief and pick a visual mode per [references/brand-strategy-and-board.md](references/brand-strategy-and-board.md) §1–3 before generating ideas. Mode picks treatment, never colours.

8–12 one-line ideas → **3** distinct marks (black-first symbols). Name a concept method for each surviving direction (monogram+meaning, product action, metaphor fusion, negative space, construction geometry — combine at most two; §2 there). A direction that cannot state its core metaphor in one line is cut before the checkpoint. Save drafts under `assets/kit/concepts/`.

At checkpoint (explore), build previews **before** final four assets:

```bash
python3 scripts/concept_sheet.py assets/kit/concepts/*.svg --names "A" "B" "C" --notes "…" "…" "…" --recommend 2
python3 scripts/tiles_board.py --title "Directions" --marks assets/kit/concepts/*.svg --names "…" "…" "…" --recommend 2
```

Show the SVG paths (or PNG via `render_png.py`) to the user — same role as [logo-design `docs/images`](https://github.com/kaankiziltug/logo-design-skill/tree/main/docs/images) tiles/concept boards.

**Kit artifact map** (full table + gallery naming): [references/deliverables.md](references/deliverables.md).

| Artifact | Script | Default path |
|----------|--------|--------------|
| Concept sheet (3 directions) | `concept_sheet.py` | `assets/kit/concept-sheet.svg` (nested `<svg>` inlines — renders in IDE preview) |
| Tiles board (3-up at checkpoint) | `tiles_board.py --marks …` | `assets/kit/tiles-board-directions.svg` |
| Tiles board (final ladder) | `tiles_board.py --icon … --banner …` | `assets/kit/tiles-board.svg` |
| Presentation board | `presentation_board.py` | `assets/kit/presentation-board.html` |
| Social cards (opt-in) | `social_cards.py` | `assets/kit/social/og-image.svg`, `github-social-preview.svg`, … |

If the user wants a **logo-design-style gallery**, rasterize those SVGs (and optional `assets/logo.svg` hero) with `render_png.py` into `docs/images/<slug>-concepts.png`, `<slug>-board.png`, `hero.png` — only when they opt in at checkpoint (question 5 in deliverables).

### 4. Checkpoint

If **explore** or brief is ambiguous: show three one-liners + recommendation; ask:

1. Direction **1/2/3**
2. Kit tier **lite / medium / full**
3. **Preview artifacts:** concept sheet | tiles board | both | + presentation (full)?
4. **Gallery publish:** copy kit PNGs to `docs/images/`? — default **skip**

**Platform (iOS + Android PNG) and social (SVG + PNG) are mandatory for any kit tier** — not optional. Run `kit_build.py` or exporters, then `validate_kit.py`.

Do not generate final four assets until direction + tier are answered. **one_shot**: default `lite`; still run platform + social; medium+ adds concept/tiles/preview; full adds presentation.

At **explore** checkpoint, generate **concept sheet** and **tiles board** (3-up) when tier is medium+ or user chose previews — before final four assets.

### 5. Brand kit (tiered)

| Tier | Scripts / outputs (`assets/kit/`) |
|------|-----------------------------------|
| **lite** | `export_variants.py` + **`export_platform_icons.py`** (iOS + Android) + **`social_cards.py --png`** + `validate_kit.py` |
| **medium** | lite + concept/tiles SVGs + `preview_sheet_lite.py --kit-dir assets/kit` |
| **full** | medium + `presentation_board.py` + `validate_kit.py --require-presentation` |

Orchestrator: `scripts/kit_build.py`. Platform contracts: [references/platform-icon-contracts.md](references/platform-icon-contracts.md). Tiers: [references/brand-kit-tiers.md](references/brand-kit-tiers.md).

### 6. Four README assets (base template)

Draw static then animated using [references/animation-choreography.md](references/animation-choreography.md). Column-1 uses chosen mark or imported `brand-mark.svg`.

**Concentric / orbit marks** (this skill’s default): staged **stroke-dash draw** on each ring → **core pop** → optional **orbit arc + tip** on the icon (`4.6s`); banner mirrors the same beats on column-1, sketch/mark stages, still/motion pills, and a **flow dot** sketch→mark (`6s`). Reference: [examples/logo-kit-svg/icon-animated.svg](examples/logo-kit-svg/icon-animated.svg), [logo-animated.svg](examples/logo-kit-svg/logo-animated.svg). Avoid opacity-only “breathe” loops unless the mark has no drawable strokes.

**This skill repo** ships the canonical demo under `examples/logo-kit-svg/` only — no root `assets/`.

After the four README assets, build kit (platform + social required):

```bash
python3 scripts/kit_build.py --icon assets/icon.svg --banner assets/logo.svg --kit-dir assets/kit \
  --name "<Brand>" --theme-color "<hex from --bg>" --title "<Brand>" --tagline "<tagline>"
python3 scripts/validate_kit.py --kit-dir assets/kit
```

### 7. Adversarial pass (recommended)

Apply [references/context-gathering.md](references/context-gathering.md) § Interrogate pass plus the anti-generic checklist and copy-length discipline in [references/brand-strategy-and-board.md](references/brand-strategy-and-board.md) §5–6. Fix **Act on** items before scripts. User asked for **`interrogate`** → run that skill on the deliverable set; otherwise one rigorous self-review.

### 8. QA gate (mandatory)

```bash
python3 scripts/svg_audit_repo_logo.py assets/icon.svg assets/icon-animated.svg assets/logo.svg assets/logo-animated.svg
python3 scripts/render_qa.py --icon assets/icon.svg --banner assets/logo.svg
python3 scripts/check_readme_embed.py --target-repo
```

Details: [references/xml-and-qa-gate.md](references/xml-and-qa-gate.md). **Read** the PNG paths printed by `render_qa.py`.

### 9. README embed

```markdown
<p align="center">
  <img src="assets/logo-animated.svg" alt="<Brand>, <tagline>" width="100%" />
</p>

# <img src="assets/icon.svg" alt="" width="28" height="28" align="top" /> <Brand>
```

## Peer skills (do not duplicate)

| Need | Skill |
|------|--------|
| Repo / architecture facts | `super-codebase-learner` |
| Grill brief, brainstorm brand, challenge scope | `super-challenge-me` |
| Multi-reviewer deliverable review | `interrogate` |
| Full identity system without README blueprint | `logo-design-skill` |
| Target stack / migration | `super-tech-blueprint` |

## Watch for

- Invalid XML comments (`<!-- --bg -->`) — see xml-and-qa-gate.
- Raw `·` `→` `✓` in `<text>` — use entities.
- `opacity="0"` on animated groups — breaks static renderers; animate in CSS only.

## Done when

- Context sources cited in brief; no invented palette, copy, contact, or legal name. Strategy + core metaphor recorded (explore/full/board); approved-asset source recorded, or `none — drafting fresh`.
- Board/presentation artifacts (when shipped) follow the rhythm and panel discipline in [references/brand-strategy-and-board.md](references/brand-strategy-and-board.md) §4; lockup taste checkpoint recorded when a secondary-word lockup was iterated.
- Four assets pass `svg_audit_repo_logo.py` and visual PNG QA.
- README contains `assets/logo-animated.svg` and `assets/icon.svg`.
- Kit tier + opted-in previews/platform match [references/deliverables.md](references/deliverables.md) and [references/brand-kit-tiers.md](references/brand-kit-tiers.md).
- Adversarial pass completed (self or `interrogate`); **Act on** findings resolved.
