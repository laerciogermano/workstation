# Context gathering (facts before pixels)

Distilled from **super-challenge-me** (facts vs decisions, grill) and **interrogate** (adversarial review before ship). Full procedures live in those skills; this file is what `logo-kit-svg` always runs.

## Facts (look up — do not ask the user)

| Source | What to extract |
|--------|-----------------|
| `README.md` | Product name, tagline, audience, feature list for pills and terminal card |
| Theme | `tokens-root.css`, `theme.css`, `tailwind.config.*`, TUI palette → [token-table.md](token-table.md) |
| Repo tree | `package.json` / `go.mod` name, existing `assets/`, prior logos |
| User-linked article or doc | Positioning, tone, category — cite URL or path |
| This skill | [library-guide.md](library-guide.md), `search_library.py`, `search_examples.py` |

Use `Read` / `Grep` / `Glob`. For a large unfamiliar repo, load **`super-codebase-learner`** first, then return here.

If a fact is missing after search, record **unknown — looked, not found** in the brief; do not invent hex colors or product copy.

## Decisions (user owns — one question at a time)

Trade-offs only the user can make: kit tier, explore vs one_shot, which concept (1/2/3), tone (`santai` vs formal copy in banner), whether to match or break category clichés.

Format (from super-challenge-me): **numbered question + recommended answer + one-line why**, then wait. Default one-at-a-time; batch only if the user asked. Question shape: [templates/grill-round.md](../templates/grill-round.md).

## When to invoke peer skills

| Signal | Skill | Mode |
|--------|-------|------|
| Brief empty, positioning unclear, “help me figure out the brand” | `super-challenge-me` | **brainstorm** |
| Plan exists but assumptions untested | `super-challenge-me` | **grill** |
| `CONTEXT.md`, ADRs, glossary, or Confluence-style docs in repo | `super-challenge-me` | **grill-docs** |
| “Too big”, estimates, hidden work (favicon pipeline, CI, LFS) | `super-challenge-me` | **challenge** |
| Resume later | `super-challenge-me` | **decision-map** |
| Four assets + kit done; want adversarial pass on deliverables | `interrogate` | Review diff / file set (see below) |

Stop peer skills at **shared understanding** — then continue phases 2–7 in `SKILL.md`. Do not let grill turn into implementation or stack invention (`super-tech-blueprint`).

## Interrogate pass (pre-ship, optional but recommended)

When copy, tokens, or layout are high-stakes, run an adversarial review **before** declaring done:

1. **Scope:** base `assets/*.svg`, opted-in `assets/kit/*` (concept sheet, tiles board, presentation HTML), `assets/kit/platform/*` if requested, brief + README embed.
2. **Intent:** One paragraph — “Ship four README SVGs from real tokens + tier X kit without clipped text or invented palette.”
3. **Lenses** (interrogate rubric, SVG-adapted):
   - **Correctness:** viewBoxes, entities, reduced-motion, pill width formula; semantic red/green only if brief column 3 mode is `diff-hunks`.
   - **Root cause vs symptom:** clipping fixed by widening pills, not shrinking font until illegible.
   - **Structural integrity:** 3-column story present; animation tells one loop, not decoration-only.
4. **Lead judgment:** Act on / Consider / Noted / Dismissed — fix **Act on** before QA scripts.

If the user did not ask for multi-model review, perform this as a single self-pass using the same lenses; invoke **`interrogate`** when they want independent reviewers.

## Exit criteria for context phase

- [ ] Brief filled with cited token source file and copy draft
- [ ] Library research notes + cliché list
- [ ] Open decisions list empty or explicitly assumed (one_shot)
- [ ] No invented colors or trademark traces from `library/svg/`
