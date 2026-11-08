# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] — 2026-07-26

### Added

- **Phase 8 — Handoff.** The pipeline no longer ends at the contact sheet. A
  finished system is now packaged into one client-ready archive, on the principle
  that the work is done when someone who was not in the room can use the files
  correctly.
- **`scripts/package_brand.py`** — builds `brand.zip`: SVG masters, fixed-size
  PNGs, PDF and EPS for print and signage, the contact sheet, `BRAND.md`, a
  generated multi-resolution `favicon.ico`, and a plain-text `README.txt` mapping
  situation to filename for the non-designer who opens it. Dependency-free, and
  byte-reproducible so an unchanged kit rebuilds identically.
- **`references/handoff.md`** — the archive layout, and what stays out of it
  (editable sources, explorations, unlicensed fonts, mockups) with the reasoning.
- **`docs/packaging.md`** — packager reference.

The packager **refuses to build when the Phase 5 matrix has holes**, mirroring
the validator's stance: a missing variant is not a smaller kit, it is a case
somebody downstream will improvise badly. Missing *recommended* items — dark-mode
variants, specific PNG sizes, EPS — are noted rather than fatal, since those
degrade gracefully where a missing `-white` variant does not.

## [1.0.0] — 2026-07-25

First public release.

### Added

- **Seven-phase pipeline** (`SKILL.md`) with an explicit gate at every phase,
  covering strategy, competitive differentiation, three concept routes, SVG
  construction, the full variant system, validation, and campaign presentation.
- **Critique mode** for auditing an existing mark instead of designing a new one.
- **Six reference documents** carrying the depth behind each phase:
  - `strategy-brief.md` — the brief template, and the one-emotion rule
  - `design-execution.md` — shape psychology, colour strategy, typography
    selection, techniques that read as expensive, and a standing anti-cliché list
  - `svg-craft.md` — grid discipline, path economy, optical corrections, and the
    counter-space rule that prevents 16-pixel fill-in
  - `deliverables.md` — the file matrix, naming convention, clear space
  - `validation.md` — the four perceptual tests and how to score them honestly
  - `campaign-presentation.md` — mockups and client presentation order
- **`scripts/validate_svg.py`** — dependency-free structural validator checking
  `viewBox`, raster embeds, external references, `<script>`, live `<text>`,
  filters, masks, path complexity, file size, and stroke weights.
- **`scripts/build_contact_sheet.py`** — generates a self-contained offline HTML
  sheet rendering the variant gallery and all four perceptual tests, including an
  interactive 5-second recall timer.
- **`examples/demo/`** — a runnable sample variant set so both scripts work
  immediately after cloning.
- Test suite, CI workflow, issue and pull request templates, and documentation
  under `docs/`.

### Notes on the design of the tooling

Two behaviours were shaped by real failures found while testing the skill
against live briefs, and are worth stating explicitly:

- **The stroke floor is component-aware.** An early version measured every file
  against a 16-pixel floor, which failed wide horizontal lock-ups that are never
  rendered at favicon width. Icons are now checked at 16&nbsp;px and
  wordmarks/lock-ups at 120&nbsp;px, derived from the filename.
- **Contact-sheet filters target the mark, not the tile.** Applying a CSS filter
  to the container transformed its background too, which rendered the "pure
  black" test as a solid black rectangle and bled blur past the tile edge.

[Unreleased]: https://github.com/jim788e/logo-creation-skill/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/jim788e/logo-creation-skill/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jim788e/logo-creation-skill/releases/tag/v1.0.0
