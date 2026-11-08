# Logo Brief Worksheet

Fill this out from `README.md` and the project's theme file before writing any SVG.

## 0. Routing

- **Mode:** `one_shot` | `explore` | `mark_only`
- **Kit tier:** `lite` | `medium` | `full`
- **Library category** (research): `readme_hero_suite` | `oss_repo_mark` | `tech_company` | `nonprofit` | `community_event`
- **Clichés to avoid** (from `search_library` / `search_examples`): `___`
- **Grill mode:** skip | grill | grill-docs
- **Intent (one paragraph):** `___`
- **Context sources** (files / URLs read): `___`
- **Unknown after lookup** (not invented): `___`
- **Preview artifacts:** none | concept-sheet | tiles-board | both | + presentation
- **Platform pack:** skip | favicon + iOS + Android (`assets/kit/platform/`)
- **Gallery publish:** skip | `docs/images/` PNGs (`<slug>-concepts.png`, `<slug>-board.png`, optional `hero.png`)
- **Social cards:** skip | `assets/kit/social/` via `social_cards.py` (OG / GitHub / square; optional `--png`)
- **Banner column 3 mode:** `diff-hunks` | `product-card` | `feature-summary` | `metrics` | `minimal` — [references/banner-column-3.md](../references/banner-column-3.md)
- **Library reference slugs (study, optional):** `___` (optional copies in `assets/kit/library-samples/` for concept/tiles only)
- **Approved-asset source (wins over drafts):** `final/…` | liked attachment | `none — drafting fresh` — [references/brand-strategy-and-board.md](../references/brand-strategy-and-board.md) §7

## 0b. Brand strategy & metaphor

Required for `explore`, `full`, or any brand board; one line each. See [references/brand-strategy-and-board.md](../references/brand-strategy-and-board.md) §1–3.

- **Category / audience:** `___`
- **Product function (one action):** `___`
- **Emotional promise / trust level:** `___`
- **Cultural position (and what it is not):** `___`
- **Visual world:** `___`
- **Core metaphor (one sentence — "the mark is X doing Y"):** `___`
- **Visual mode:** dark-developer | dark-product | dark-nature | dark-security | light-editorial | luxury | voice | cultural
- **Concept method per direction:** 1 `___` · 2 `___` · 3 `___` (combine at most two methods)
- **Brand name (public/logo):** `___`
- **Legal name (formal print only, source cited):** `___` | `unknown — looked, not found`
- **Lockup taste checkpoint (if secondary word iterated):** `e.g. descriptor: small · light · wide tracking (letter-spacing ≈ ___)` — last user preference wins; project decision, not a universal rule
- **Board rhythm plan (boards/full only):** quiet `___` · functional `___` · emotional `___` · technical `___` · atmospheric `___` · detailed `___`

## 1. Brand & Copy

- **Repository name (wordmark):** `<Part1><Part2>` (e.g. `Apply` in `--fg` + `Diff` in `--accent`, total chars: `___`)
- **Wordmark cursor `x` (`184 + ceil(chars × 20.2)`):** `___`
- **One-line tagline (`<= 32 chars`):** `___________________________`
- **Pill 1 text & width (`ceil(chars × 7.2) + 26`):** `_________________` -> `width="___"`
- **Pill 2 text & width (`ceil(chars × 7.2) + 22`):** `_________________` -> `x="___" width="___"`
- **Bottom motto line (`<= 48 chars`):** `____________________________________________`

## 2. Column 3 card copy

Skip red/green rows when mode ≠ `diff-hunks`. See [references/banner-column-3.md](../references/banner-column-3.md).

- **Topbar chip (`branch: ...` or `workspace: ...`):** `_______________________` -> `width="___"`
- **Topbar section tag (`@@ ... @@`):** `________________`
- **Context line 1:** `________________________________________`
- **Red deleted row (`-`):** `________________________________________`
- **Green added row (`+`):** `________________________________________`
- **Inline badge 1 & 2:** `[ ____________ ]` `[ &#10003; __________ ]`
- **Context line 2:** `________________________________________`
- **Bottom 4-stage pipeline:** `<stage1> &#8594; <stage2> &#8594; <stage3> &#8594; [ <output-artifact> ]`

## 3. Application Color Tokens

- **Source file read:** `___________________________`
- `--bg` (outer canvas fill): `#______`
- `--surface` (card fill): `#______`
- `--surface2` (topbar / flap fill): `#______`
- `--line` (outer border / divider): `#______`
- `--line2` (card border / spine): `#______`
- `--fg` (primary text): `#______`
- `--muted` (secondary text): `#______`
- `--dim` (line numbers / motto): `#______`
- `--accent` (brand highlight): `#______`
- `--amber-bg` (accent chip fill): `#______`
- `--accent-dim` (accent chip border): `#______`
- `--del` / `--del-bg` (red `-` row): `#______` / `#______`
- `--add` / `--add-bg` (green `+` row): `#______` / `#______`
