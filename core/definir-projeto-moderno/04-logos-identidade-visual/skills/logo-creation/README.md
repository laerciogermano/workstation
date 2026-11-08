<h1 align="center">Logo Creation Skill</h1>

<p align="center">
  <em>A Claude skill that designs complete logo identity systems — and refuses to ship one that fails at 16&nbsp;pixels.</em>
</p>

<p align="center">
  <a href="https://github.com/jim788e/logo-creation-skill/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/jim788e/logo-creation-skill/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg"></a>
  <a href="https://github.com/jim788e/logo-creation-skill/releases"><img alt="Release" src="https://img.shields.io/github/v/release/jim788e/logo-creation-skill?sort=semver"></a>
  <img alt="Python" src="https://img.shields.io/badge/python-3.10%2B-blue">
  <img alt="Dependencies" src="https://img.shields.io/badge/dependencies-none-brightgreen">
</p>

---

## Why this exists

Most logo output fails for one reason: **it was never tested.** It looks fine at
512&nbsp;px on a white slide and then falls apart in a browser tab, a one-colour
stamp, or a glance from a moving car.

This skill makes the tests mandatory and the strategy explicit. It runs a
seven-phase pipeline with a gate at every step, hand-authors vector SVG, and
then puts the result through four perceptual tests plus an automated structural
validator. A failure sends the work back to the drawing board rather than
lowering the bar.

It also solves the "generic AI logo" problem the only way that actually
works — not by prompting harder, but by researching the category and writing an
explicit **avoid list** before a single shape is drawn.

## The pipeline

| Phase | Output | Gate |
| :-- | :-- | :-- |
| 1. Strategy | Brand brief | Can you state the brand in one sentence and one emotion? |
| 2. Differentiation | Competitive map | Do you know what everyone else looks like — and what to avoid? |
| 3. Direction | 3 concept routes | Does each route express a *different* strategic idea? |
| 4. Construction | The mark, in SVG | Does the symbol read without the wordmark? |
| 5. System | Full variant set | Does every layout and colour context have a file? |
| 6. Validation | Test report | Did it pass all four tests, honestly scored? |
| 7. Presentation | Contact sheet | Would this survive a client review? |
| 8. Handoff | `brand.zip` | Could the client use every file without asking you a question? |

## The four tests

Structural checks catch broken files. They cannot catch a bad logo. These can:

| Test | What it catches |
| :-- | :-- |
| **16-pixel** | Counters filling in, thin elements vanishing, shapes merging, silhouette drift |
| **Grayscale / single colour** | Colour doing structural work that shape should be doing |
| **Blur** | A mark nobody will recognise at distance or in peripheral vision |
| **5-second recall** | A mark whose identity lives in detail nobody retains |

## Install

```bash
git clone https://github.com/jim788e/logo-creation-skill.git ~/.claude/skills/logo-creation
```

Then invoke it in Claude Code with `/logo-creation <brand name>`, or simply ask
for a logo — the skill description triggers on *logo*, *wordmark*, *brand mark*,
*visual identity*, *icon design*, *favicon*, *rebrand*, and related terms.

To audit an existing mark instead of designing a new one:

```
/logo-creation critique path/to/logo.svg
```

## Scripts

Python 3.10+, **standard library only** — no install step, no dependencies.

### Validate

```bash
python scripts/validate_svg.py out/logo/
```

Checks `viewBox` presence, embedded rasters, external references, `<script>`,
live `<text>`, filters and masks, path complexity, file size, and stroke weights
against the smallest size each component is actually deployed at.

The stroke floor is component-aware: **16&nbsp;px** for an icon or favicon,
**120&nbsp;px** for a wordmark or lock-up, which is never rendered at favicon
width. Component type is read from the filename, so the naming convention in
[`references/deliverables.md`](references/deliverables.md) matters.

```bash
python scripts/validate_svg.py out/logo/ --icon-size 16 --lockup-size 120
```

Errors exit non-zero. Warnings never fail the run but require a written
justification before Phase&nbsp;6 passes.

### Contact sheet

```bash
python scripts/build_contact_sheet.py out/logo/ --name "Brand Name"
```

Inlines every SVG into one self-contained, offline HTML page rendering the
variant gallery, a favicon strip at 16–64&nbsp;px, grayscale and pure
black/white, three blur intensities, an interactive 5-second recall timer, and a
favicon-to-signage scale ramp.

Try it immediately against the bundled example:

```bash
python scripts/build_contact_sheet.py examples/demo --name "Demo"
```

### Package for the client

```bash
python scripts/package_brand.py out/logo/ --name "Brand Name" --exports out/exports/
```

Builds the archive you actually send: SVG masters, fixed-size PNGs, PDF and EPS
for print and signage, a generated multi-resolution `favicon.ico`, the contact
sheet, `BRAND.md`, and a plain-text `README.txt` that maps *situation* to
*filename* for the non-designer who opens it.

It **refuses to build if the deliverable matrix has holes** — a missing variant
is a case someone downstream will improvise badly. `--force` overrides and lists
the gaps. Output is byte-reproducible, so rebuilding an unchanged kit produces an
identical zip.

The packager collects and organises; it does not rasterise. Generate the PNG,
PDF and EPS exports first and point `--exports` at them.

## Repository layout

```
SKILL.md                        the pipeline and its gates
references/
  strategy-brief.md             Phase 1 — brief template and questions
  design-execution.md           Phases 2–3 — shape, colour, type, anti-cliché list
  svg-craft.md                  Phase 4 — construction, optical corrections
  deliverables.md               Phase 5 — file matrix, naming, clear space
  validation.md                 Phase 6 — the four tests and how to score them
  campaign-presentation.md      Phase 7 — mockups and client presentation
  handoff.md                    Phase 8 — the client archive and its exclusions
scripts/
  validate_svg.py               structural validator (stdlib only)
  build_contact_sheet.py        offline HTML test sheet (stdlib only)
  package_brand.py              client-ready brand.zip (stdlib only)
examples/demo/                  a runnable sample variant set
docs/                           deeper documentation
tests/                          pytest suite covering both scripts
```

## Deliverables it produces

| Component | Purpose | Variants |
| :-- | :-- | :-- |
| Icon / symbol | App icons, favicons, avatars | color, black, white, darkmode |
| Wordmark | Where the symbol is redundant | color, black, white |
| Horizontal lock-up | The default | color, black, white, darkmode |
| Stacked lock-up | Square and portrait spaces | color, black, white |
| Favicon | 16&nbsp;px-optimised, may be simplified | single file |

Plus clear-space rules, minimum sizes, colour values, and misuse guidance — all
packaged into a single client-ready `brand.zip` in Phase&nbsp;8.

## Design principles it enforces

1. **Strategy precedes pixels.** No mark is drawn before the brief is written.
2. **The icon must pass at 16 pixels**, regardless of how good it looks large.
3. **The mark must work in pure black and pure white.** Colour is applied last
   and must be removable.
4. **Vector only.** Hand-authored SVG with a `viewBox`; no rasters, no live
   `<text>`, no external references in final deliverables.
5. **No unearned complexity.** Every gradient and extra colour justifies itself
   against the 16-pixel and blur tests, or it goes.

## Optional: Affinity Designer

If Affinity is running with MCP enabled, finished SVGs can be opened there for
refinement and export to PDF/EPS/PNG at scale. The pipeline never depends on
it — SVG remains the source of truth, and the step is skipped silently when the
app is unavailable.

> **Note:** Affinity's JavaScript SDK has no expand-stroke command (verified
> against 3.2.3). If you need outlined strokes, compute the outlines rather than
> relying on the app — see [`docs/outlining-strokes.md`](docs/outlining-strokes.md).

## Documentation

- [Pipeline in depth](docs/pipeline.md)
- [Validator reference](docs/validator.md)
- [Contact sheet reference](docs/contact-sheet.md)
- [Packaging reference](docs/packaging.md)
- [Outlining strokes without an expand-stroke API](docs/outlining-strokes.md)

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
The one rule specific to this project: **if you change a script, the tests must
still pass, and if you change a design rule, say which real failure it prevents.**

## License

[MIT](LICENSE) © 2026 Dimitrios Misios
