# Brand strategy, metaphor, and board composition

Distilled in our own words from premium brand-kit board practice (the `brandkit` skill family) and adapted to this skill's fixed contracts. This file does **not** replace the 904×256 blueprint, the four README assets, or the tier table — it governs what happens *before* concepts and how *additional* boards are composed. Do not copy board layouts verbatim from any reference skill; extract rhythm and discipline, then rebuild with this repo's real tokens and marks.

## 1. Strategy before concepts (required for `explore`, `full`, or any brand board)

Do not draw directions until these are answered from facts or explicitly marked assumed. Record them in [templates/logo-brief.md](../templates/logo-brief.md) §0b.

| Question | What to capture |
|---|---|
| Category | What shelf does this sit on? Name the real competitors/category, not "tech". |
| Audience | Who must recognise and trust it in 3 seconds? |
| Product function | The one action/outcome the product performs. |
| Emotional promise | How using it should feel (calm, fast, guarded, premium…). |
| Cultural position | Builder-native, editorial, institutional, playful — and what it is *not*. |
| Trust level | Playful ↔ regulated/serious. Drives seal/badge and copy restraint. |
| Visual world | Materials, surfaces, and scenes the brand legitimately inhabits. |
| Core metaphor | One sentence: "The mark is *X* doing *Y*" (e.g. a frame that builds). |
| Avoid list | Symbols, moods, and clichés this brand must never use (feeds §6). |

**Core-metaphor test.** A direction is ready only if it can answer, in one line each: what the brand represents, what the core metaphor is, how the mark expresses it, how it scales (icon → wordmark → UI → print), and why it is ownable rather than category-generic. If a direction fails the metaphor line, it is decoration — cut it before the checkpoint.

**Facts vs taste.** Category, function, tokens, and existing copy are facts (look them up). Metaphor, emotional promise, and which avoid-list items to break are user decisions — ask with the grill cadence in [process.md](process.md), one question + recommendation at a time.

## 2. Concept methods (pick one, combine at most two)

Generate the 8–12 one-liners in SKILL.md Phase 3 by naming a method for each surviving direction. Record the method per direction in the brief; a direction with no named method is not presented.

| Method | How it works | Watch out for |
|---|---|---|
| Monogram + meaning | Initial fused with the metaphor via cut, fold, negative space, or geometry | A plain letter in a rounded square is not a concept |
| Product action | The product's main verb (build, protect, convert, speak, automate…) reduced to an abstract gesture | Literal clip-art of the tool/object |
| Metaphor fusion | Two meaningful ideas merged into one reduced shape, readable at 16 px | Fusion so subtle nobody reads either idea |
| Negative space | The intelligence lives in the cut-out: hidden arrow, protected centre, internal path | Fragile gaps that fill in at small sizes |
| Construction geometry | Mark built from a declared system: circles, diagonal cuts, grid, frames, orbital paths | Geometry theatre with no link to the metaphor |

Black-first still applies: each direction must work as a single-colour silhouette before colour or animation is discussed.

## 3. Visual modes (treatment, never a palette invention)

Pick one mode in the brief. A mode selects typography feel, texture, density, and panel mood — it **never** invents hex values. Every colour still comes from [token-table.md](token-table.md); if the mode wants a colour the tokens do not have, record `unknown — looked, not found` or ask, do not approximate.

| Mode | Typical brands | Treatment cues | Mark logic |
|---|---|---|---|
| Dark developer / builder | Dev tools, infra, AI builders | Near-black, mono accents, terminal/prompt fragments, subtle grid | Cursor/frame, scaffold, modular construction |
| Dark product / operator | Business, growth, automation tools | Dark + warm accent, chips, segmented flows, icon rows | Signal, switch, loop, path |
| Dark nature / calm system | Strategy, travel, wellness, quiet SaaS | Deep green family *from tokens*, landscape image, soft overlays | Path, horizon, moon, folded mark |
| Dark security / threat | Security, compliance monitoring | Black/navy family *from tokens*, radar/boundary lines, alert chips | Shield, eye, boundary, protected core |
| Light editorial / compliance | Legal, privacy, documents | Ivory/paper *from tokens*, small serif labels, seals, stationery | Seal, document, stamp, monogram |
| Luxury / beauty / fashion | Premium services, hospitality | Stone/espresso family *from tokens*, serif wordmark, emboss, editorial crops | Monogram, seal, vessel, ritual object |
| Voice / communication | Voice AI, chat, assistants | Indigo family *from tokens*, waveform/pulse, phone crop, input bar | Wave + initial, sound orb, speech path |
| Cultural / experimental | Music, creative tools, events | Halftone/print texture, bold single accent, poster crops | Custom wordmark, mascot with restraint |

One accent may carry the whole system. Accents must repeat across panels; no rainbow, no generic purple-blue glow unless the tokens and category justify it.

## 4. Board composition rhythm (boards, not the README banner)

Applies to `concept-sheet.svg`, `tiles-board*.svg`, `presentation-board.html` (full tier), and any optional brand-kit board SVG the user requests. It does **not** change the banner blueprint.

**Rhythm rule.** A board is a curated sequence, not nine equally loud tiles. Assign each panel one role and vary intensity:

`quiet → functional → emotional → technical → atmospheric → detailed`

At least one panel must be deliberately quiet (large negative space, logo or one line only) and at least one deliberately detailed (construction, chips, or system detail). If every panel shouts, recompose before rendering.

**Default 3×3 panel DNA** (adapt names to the brand; keep the role, not the literal content):

| # | Panel role | Content discipline |
|---|---|---|
| 1 | Logo cover (quiet) | Primary lockup, minimal title, strong negative space |
| 2 | Construction (technical) | Grid, geometry, or negative-space logic — why the mark exists |
| 3 | Digital application (functional) | Browser/app/terminal fragment or app icon — one surface only |
| 4 | Brand essence (quiet) | One short tagline, large type, sparse background |
| 5 | Colour system | Swatches/discs/chips from real tokens, hex labelled once |
| 6 | Typography | Specimen or pairing; show the lockup treatment actually shipped |
| 7 | Physical application | Card, folder, badge, seal, letterhead, or object — one mockup |
| 8 | Image direction (atmospheric) | One art-directed image/texture in palette; no generic stock people |
| 9 | System detail (detailed) | Icon row, chips, pattern, or component strip at small scale |

Compact alternative when the user wants a mini-deck: 2×3 (cover, digital surface, functional/command, atmosphere, construction/badge, tagline). Keep gutters consistent, page-number/footer details tiny and sparse, and the same mark — identically drawn — in every panel.

**Consistency checks before render:** same mark geometry in all panels (no redrawing variants per panel), accent repeats in ≥3 panels, one dominant palette, text sparse enough to read at board scale (see §5).

## 5. Copy-length discipline (banner, boards, and social)

Short copy beats a long slogan everywhere in this skill. Existing hard limits stay: tagline ≤32 chars, motto ≤48 chars (brief §1).

- **Board text budget:** brand name, one tagline, at most one URL *or* one command, and 2–5 short section labels. Nothing else. No paragraphs, no lorem ipsum, no tiny fake body copy, no dense menu lists.
- **Tagline test:** short, specific, and sayable. Prefer a concrete promise or stance over corporate abstraction. Reject buzzword soup, fake-inspirational fluff, and any line that would fit a competitor unchanged.
- **One highlighted word** per board/panel at most (accent chip or accent-coloured word). If everything is highlighted, nothing is.
- If a panel needs a paragraph to be understood, the panel — not the paragraph — is wrong. Recompose or cut the panel.

## 6. Anti-generic checklist (run in the adversarial pass)

Fail the pass and fix before script QA if any item is true:

- [ ] Mark could belong to any startup in the category (generic bolt/sparkle/blob/gradient orb with no metaphor)
- [ ] Random floating icons, meaningless blobs, or clip-art symbols decorate rather than mean
- [ ] Generic startup gradient or cheap neon carries the identity instead of tokens
- [ ] Board reads as a stock template, corporate slide deck, or messy collage of unrelated mockups
- [ ] Logo redrawn inconsistently between panels/assets, or variants invented per placement
- [ ] Too many colours, or an accent that appears once and never repeats
- [ ] Fake tiny UI / unreadable labels used to simulate depth
- [ ] Copied or near-copied famous mark, fake luxury crest, or library art pasted into deliverables (study-only — [library/TRADEMARKS.md](../library/TRADEMARKS.md))
- [ ] Long slogan or paragraph copy compensating for a weak mark or panel

## 7. Final-asset precedence and replica fidelity

Hard-won rule from real studio work: **the asset the user already chose beats anything generated earlier.**

1. **Precedence order:** user-named `final/` (or equivalent approved folder/file) → user attachment or pasted asset they said they like → last checkpoint-approved draft → `assets/` drafts → `sample/`/exploration folders. When folders disagree, the higher source wins for geometry, colour, copy, and animation; lower folders are reference only.
2. **Record it.** Brief §0 records the winning source path. If no approved source exists, write `none — drafting fresh`.
3. **Replica fidelity.** When the user likes an attachment or prior asset, replicate it faithfully: same geometry, proportions, colour roles, and animation behaviour. Do not silently substitute a "similar" mark, a different animation (e.g. replacing a staged draw with an opacity breathe), or re-typeset type. If an exact replica is technically impossible (missing font, outline conversion, renderer limit), say so before shipping and name the deviation.
4. **Diff before overwrite.** Before replacing an approved asset, state what will change and why; keep the approved file recoverable until the replacement passes visual QA.

## 8. Lockup taste checkpoint (typography iterations)

Secondary-word lockups (e.g. a small descriptor word under the primary wordmark) are a taste decision, not a formula.

- Explore at most the two honest poles first: **small, light, wide-tracked** (quiet, premium, subordinate) vs **large/bold, tight** (loud, primary-weight). Render both at real size before asking.
- The user's **last explicit preference wins** and is recorded in the brief as a *taste checkpoint* — size relationship, weight, and tracking (e.g. "descriptor: small · light · letter-spacing ≈ 0.35em") — so later assets (wide lockup, letterhead, board typography panel) reuse it instead of re-litigating it.
- A recorded checkpoint is a project decision, not a universal rule. Do not export it to other brands, and do not override it silently in a later variant; reopen it only when the user does.

## 9. Brand name vs legal name (print and formal surfaces)

The logo and public brand surfaces use the **brand name** only. A legal entity name (e.g. an Indonesian `PT. …` name) is a different string with a different job:

- **Brand name:** logo, lockups, boards, social, GBP/web profiles, README.
- **Legal name:** only where formality requires it — letterhead/kopsurat legal line, invoices, contracts, signatures, footers of formal letters. On a letterhead it sits as a small legal line beside/under the brand lockup; it never replaces the wordmark and never enters the logo SVG.
- Never invent either string. Read the legal name from the user's document (letterhead draft, deed reference, or explicit message) and record its source in the brief; if not found, write `unknown — looked, not found` and ship the letterhead with the brand name only rather than guessing a legal suffix.

## 10. No invented facts (palette, copy, contact, legal)

Extends SKILL.md rule 1 beyond colour: palette, tagline, contact details, addresses, URLs, and legal names are all read from a named source or recorded as unknown. A board, letterhead, or social card must never be padded with plausible-looking invented contact lines to look "complete" — an honest empty slot beats fabricated completeness.
