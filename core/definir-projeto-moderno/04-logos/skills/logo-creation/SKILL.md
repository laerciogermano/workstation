---
name: logo-creation
description: "Design a complete logo identity system from strategy to client handoff. Runs an 8-phase pipeline — brand brief, competitive differentiation, symbol and typography design, SVG construction, full variant set (icon, wordmark, stacked, horizontal, mono, inverted), the four validation tests (16-pixel, grayscale, blur, 5-second recall), and a packaged brand.zip ready to send. Use when the user says logo, logomark, wordmark, brand mark, brand identity, visual identity, icon design, favicon, rebrand, logo system, brand guidelines, or asks to design/critique/refine a logo."
argument-hint: "<brand name> — or 'critique <path-to-svg>'"
user-invocable: true
license: MIT
metadata:
  version: "1.1.0"
  category: design
---

# Logo Creation

Design logos that survive contact with the real world: a 16px favicon, a grayscale
fax, a blurred glance from a moving car, a billboard. Most logo output fails not
because it is ugly but because it was never tested. This skill makes the tests
mandatory and the strategy explicit.

## Non-negotiables

Read these before anything else. They override taste, trend, and user enthusiasm.

1. **Strategy precedes pixels.** No mark is drawn before the brief in Phase 1 is
   written and confirmed. A logo that cannot state what it means is decoration.
2. **The icon must pass at 16 pixels.** If the symbol is unreadable as a favicon,
   it is not finished, regardless of how good it looks at 512px.
3. **The mark must work in pure black and pure white.** Colour is the last layer
   added, never the thing holding the design together.
4. **Vector only.** Output is hand-authored SVG with a `viewBox`, no embedded
   rasters, no `<text>` elements in final deliverables, no external references.
5. **No unearned complexity.** Every gradient, every extra path, every third
   colour must justify itself against the 16-pixel and blur tests or be removed.

## The pipeline

Eight phases. Do not skip forward. Each phase has a gate — a question that must be
answerable before moving on.

| Phase | Output | Gate |
| :-- | :-- | :-- |
| 1. Strategy | Brand brief | Can you state the brand in one sentence and one emotion? |
| 2. Differentiation | Competitive map | Do you know what everyone else in the category looks like — and what to avoid? |
| 3. Direction | 3 concept routes | Does each route express a *different* strategic idea, not a different decoration? |
| 4. Construction | The mark, in SVG | Does the symbol read without the wordmark? |
| 5. System | Full variant set | Does every layout and colour context have a file? |
| 6. Validation | Test report | Did it pass all four tests, honestly scored? |
| 7. Presentation | Campaign contact sheet | Would this survive a client review? |
| 8. Handoff | `brand.zip` | Could the client use every file without asking you a question? |

---

### Phase 1 — Strategy

Load `references/strategy-brief.md` and work through it with the user. Ask the
questions; do not invent the answers. If the user cannot or will not answer, state
your assumptions explicitly in the brief and continue — but write them down as
assumptions, not facts.

The brief must end with three fixed decisions:
- **One sentence** describing the brand.
- **One primary emotion** the mark must evoke (Trust / Innovation / Play / Luxury / Craft / Speed / Care — pick one, not three).
- **One audience** the mark speaks to.

Gate: those three lines exist and the user has seen them.

### Phase 2 — Differentiation

Research the category before designing. Use WebSearch to find the leading brands
in the industry and describe their marks concretely — shape language, colour,
type classification.

Then write the **avoid list**: the visual clichés this category is drowning in.
This is where the "generic AI logo" problem gets solved — not by prompting harder,
but by naming the tropes and refusing them. See the standing tropes list in
`references/design-execution.md`.

Gate: you can name at least three things this logo will deliberately *not* do.

### Phase 3 — Direction

Produce **three routes**, each a distinct strategic idea:

- Route A — the literal/representational read
- Route B — the abstract/geometric read
- Route C — the typographic read (letterform, monogram, negative space)

For each: a one-line rationale, the shape psychology, the type classification, and
the colour intent. Sketch each as a rough SVG at 96×96 so the user is choosing
between *things*, not descriptions. Consult `references/design-execution.md` for
shape psychology, colour strategy, typography selection, and the specific
techniques that make a mark read as expensive rather than merely minimal.

Gate: the user picks one route (or asks for a hybrid — take that as a new route
and re-present).

### Phase 4 — Construction

Build the chosen mark properly. `references/svg-craft.md` covers construction
discipline: grid and optical alignment, path economy, stroke-to-fill conversion,
counter-space, optical corrections, and the SVG structure conventions the
validator enforces.

Two components, built separately:
- **The symbol** — must be independently recognisable.
- **The wordmark** — letterforms drawn or set, then outlined to paths.

Gate: cover the wordmark. If the symbol alone is anonymous, return to Phase 3.

### Phase 5 — System

Generate the full deliverable set per `references/deliverables.md`: icon,
wordmark, horizontal lock-up, stacked lock-up, and for each — full colour, pure
black, pure white, dark-mode. Plus clear-space and minimum-size rules.

Naming and directory layout are specified in that reference. Follow it exactly;
the contact-sheet builder reads those filenames.

Gate: every file in the deliverables table exists on disk.

### Phase 6 — Validation

Run the validator on every SVG:

```bash
python scripts/validate_svg.py out/logo/
```

It checks structure, hairline strokes that vanish at favicon size, raster
embeds, live text, external references, and path complexity. Errors block; warnings
require a written justification.

Then run the four perceptual tests from `references/validation.md` — 16-pixel,
grayscale, blur, and 5-second recall — using the contact sheet from Phase 7. Score
each honestly. A failed test means returning to Phase 4, not lowering the bar.

Gate: zero validator errors, and all four perceptual tests passed with reasoning
recorded.

### Phase 7 — Presentation

```bash
python scripts/build_contact_sheet.py out/logo/ --name "Brand Name" --out out/logo/contact-sheet.html
```

This produces a self-contained HTML sheet: every variant, every test rendered
live via CSS (favicon strip at 16/24/32px, grayscale, blur, dark mode, inverted),
plus an interactive 5-second recall timer. Open it and actually look at it — the
tests are worthless unless a pair of eyes runs them.

For the campaign layer — business card, packaging, signage, app icon, billboard —
see `references/campaign-presentation.md`. Present the logo in use, not floating
on white.

### Phase 8 — Handoff

The work is not finished when the files exist; it is finished when someone who
was not in the room can use them correctly. Package everything into one archive:

```bash
python scripts/package_brand.py out/logo/ --name "Brand Name" --exports out/exports/
```

This routes the SVG masters, PNG rasters and print formats into the folders a
recipient expects, builds a multi-resolution `favicon.ico` from the small icon
PNGs, writes a plain-text `README.txt` answering *which file do I use for this*,
and **refuses to build if the Phase 5 matrix has holes** — a missing variant is
a case someone downstream will improvise badly.

Generate the raster and vector exports first (Affinity, Inkscape, or any faithful
SVG renderer); the packager collects, it does not convert. Warnings name the
gaps — a missing EPS is what stops a sign shop from quoting the job.

See `references/handoff.md` for the archive layout, what belongs in it, and what
deliberately does not.

Gate: the archive builds without `--force`, and every folder in it is one a
non-designer can act on.

---

## Critique mode

When invoked as `critique <path>` or when the user brings an existing logo, skip
Phases 3–5. Run Phase 1 in reverse (infer the strategy the mark currently
communicates), run the validator and all four tests, then report:

- What the mark currently says vs. what the brand needs it to say
- Test-by-test pass/fail with the specific failure mode
- The smallest set of changes that fixes the failures

Be direct about failures. A polite critique that lets a 16-pixel failure ship is
a bad critique.

## Optional: Affinity export

If Affinity Designer is running with MCP enabled (`mcp__Affinity__*` tools
respond), the finished SVGs can be opened there for pixel-level refinement and
export to PDF/EPS/PNG at scale. Check availability with
`mcp__Affinity__list_sdk_documentation` — if it errors, the app isn't running and
this step is simply skipped. Never block the pipeline on it; SVG is the source of
truth.

## Reference files

| File | Load when |
| :-- | :-- |
| `references/strategy-brief.md` | Phase 1 — the brief template and questions |
| `references/design-execution.md` | Phases 2–3 — shape, colour, type, luxury cues, anti-cliché list |
| `references/svg-craft.md` | Phase 4 — construction discipline and SVG conventions |
| `references/deliverables.md` | Phase 5 — file matrix, naming, clear space |
| `references/validation.md` | Phase 6 — the four tests and how to score them |
| `references/campaign-presentation.md` | Phase 7 — mockups and client presentation |
| `references/handoff.md` | Phase 8 — the client archive: layout, contents, exclusions |
