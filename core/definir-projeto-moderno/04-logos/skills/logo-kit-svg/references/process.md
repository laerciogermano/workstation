# Process, checkpoints, and kit routing

## Phase 0: context

Before the brief: [context-gathering.md](context-gathering.md) — learn repo/docs, facts vs decisions, invoke `super-codebase-learner` / `super-challenge-me` / `interrogate` when needed.

## Modes

| Mode | Trigger | Checkpoint |
|------|---------|------------|
| **one_shot** (default) | “logo for this repo”, theme file present | Skip concept pause; ask kit tier once if omitted (default `lite`) |
| **explore** | “directions”, “concepts”, empty brand | Stop after concept summary; require direction + kit tier |
| **mark_only** | User supplies `assets/brand-mark.svg` | Skip concepting for column-1; still run kit + four README assets |

## After concepts (explore or ambiguous brief)

Send one message with:

- **(A)** three one-line direction summaries
- **(B)** a single recommendation
- **(C)** explicit questions:
  - “Which direction (1/2/3)?”
  - “Kit depth: lite / medium / full?”
  - “Generate concept sheet / tiles board / presentation?” (see [deliverables.md](deliverables.md))
  - “Export favicon + iOS + Android PNGs?”
  - “Publish PNG gallery under `docs/images/`?” (logo-design-skill style)
  - “Generate social cards under `assets/kit/social/`?” (OG / GitHub / square)

Do **not** generate kit deliverables or the four README SVGs until the user answers (explore mode).

### Kit scripts (after user picks previews / tier)

From the target repo (skill scripts copied or run from skill root with paths adjusted):

```bash
# Explore checkpoint — three directions in assets/kit/concepts/
python3 scripts/concept_sheet.py assets/kit/concepts/*.svg --names "A" "B" "C" --notes "…" "…" "…" --recommend 2
python3 scripts/tiles_board.py --title "Directions" --marks assets/kit/concepts/*.svg --names "…" "…" "…" --recommend 2

# Full tier — after four README assets exist
python3 scripts/presentation_board.py path/to/presentation-spec.json
python3 scripts/tiles_board.py --title "Final marks" --icon assets/icon.svg --banner assets/logo.svg

# Optional gallery (user opted in)
python3 scripts/render_png.py assets/kit/concept-sheet.svg -o docs/images/<slug>-concepts.png -w 1200
python3 scripts/render_png.py assets/kit/tiles-board.svg -o docs/images/<slug>-board.png -w 1200

# Optional social cards (after four README assets)
python3 scripts/social_cards.py --icon assets/icon.svg --title "<Brand>" --tagline "…" \\
  --theme-bg "<--bg>" --theme-fg "<--fg>" --png
```

See [deliverables.md](deliverables.md) for artifact → script → path table and naming parity with logo-design `docs/images`.

## Skip checkpoint when

User supplied exact copy, theme path, and “just ship” / one_shot mode. State assumptions and proceed with kit tier `lite` unless they already named a tier.

## Never skip

- The four README assets once kit work starts
- Script QA gate (`svg_audit_repo_logo.py`, `render_qa.py`, `check_readme_embed.py`)

See [brand-kit-tiers.md](brand-kit-tiers.md) for tier deliverables.
