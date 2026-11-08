# Reference library guide

## Purpose

Study trademark and OSS marks to avoid clichés and to sanity-check scale — **not** to paste into deliverables. See [library/TRADEMARKS.md](../library/TRADEMARKS.md).

Peer layout (catalog + classifications + stats + gallery): [logo-design-skill `assets/library`](https://github.com/kaankiziltug/logo-design-skill/tree/main/skills/logo-design/assets/library).

**Dual source:** a curated **Simple Icons** subset (`library-slugs.txt`, synced via `sync_library.py`) plus **logo-design-skill peer imports** (`library-slugs-logo-design.txt`, manual copy only — not Simple Icons). Both are study-only; see [library/TRADEMARKS.md](../library/TRADEMARKS.md). Categories come from our `taxonomy.json` + per-slug overrides (`source`: `simple-icons` | `logo-design-skill`).

## Artifacts (`library/`)

| File | Role |
|------|------|
| `svg/` | Committed study marks (offline CI) |
| `taxonomy.json` | Category definitions and dimension vocab |
| `taxonomy-overrides.json` | Per-slug classification overrides |
| `catalog.json` | Machine index for `search_library.py` |
| `classifications.json` | Taxonomy-aligned rows (generated) |
| `stats.json` | Counts by category/dimension + sync timestamps |
| `regions.json` | Macro → member `region` codes for `--macro` search |
| `REGIONS.md` | Market tag vocabulary (not legal geography) |
| `gallery.html` | Static browser UI (open locally after build) |

## Search

```bash
python3 scripts/search_library.py --category tech_company --summary
python3 scripts/search_library.py --region jp --industry automotive --summary
python3 scripts/search_library.py --macro apj --summary
python3 scripts/search_library.py --macro emea --industry automotive --summary
python3 scripts/search_examples.py --has-animation true --summary
```

**Geography / industry:** optional `region` and `industry` on Simple Icons slugs (see `library/REGIONS.md`). `region` is a **market tag for search**, not legal geography. Macro sales regions (`emea`, `apj`, `asean`, …) expand via `library/regions.json` and `search_library.py --macro`. After `build_catalog.py`, `stats.json` includes `by_region`, `by_macro_region`, and `by_industry`; `classifications.json` rows carry the same fields when set in `taxonomy-overrides.json`.

Agents can skim `stats.json` for shelf coverage, `classifications.json` for structured filters, or open `gallery.html` for visual scan.

## Shelf test (README hero)

1. Pick 3–5 entries in `readme_hero_suite` or `oss_repo_mark`.
2. Ask: does our 3-column banner tell a clearer product story than a wordmark-only hero?
3. Record 3–5 clichés to avoid in the logo brief.

## Library samples (concept / tiles only)

Use slugs as **reference**, not deliverable art. Full rules: [banner-column-3.md](banner-column-3.md).

1. Note slugs in the brief (`Library reference slugs`).
2. Optionally `cp library/svg/<slug>.svg` → `assets/kit/library-samples/` for `concept_sheet.py` / `tiles_board.py` collages.
3. Draw **original** icon and banner marks; echo weight or layout ideas only.

## Maintain

```bash
python3 scripts/sync_library.py --clone   # optional network
python3 scripts/build_catalog.py          # catalog + classifications + stats + gallery.html
```

Committed curated SVGs keep CI offline; slugs live in `library-slugs.txt`.

### Indonesia startups (Simple Icons)

- Curated slugs under `# Indonesia startups` in `library-slugs.txt` (Gojek, Grab, Bukalapak, Blibli, Shopee, Xendit). Tag `region: id` and `industry` in `taxonomy-overrides.json`, then `sync_library.py --clone`.
- Brands without an SI slug (Tokopedia, Traveloka, OVO, Dana, Astro ID, …) → [library/REGIONS.md](../library/REGIONS.md) and `$manual_study_gaps` — not `astro` (that slug is astro.build).

### Sports / club shelf

- **Simple Icons path:** append slugs to `library-slugs.txt` (leagues, apparel, fitness apps), classify in `taxonomy-overrides.json` as `sports_brand` or `sports_league`, then `sync_library.py --clone`.
- **Club crests** (Persija, Chelsea, etc.) are usually **not** on Simple Icons — see `$manual_study_gaps` in `taxonomy-overrides.json` and the manual workflow in [library/TRADEMARKS.md](../library/TRADEMARKS.md). Do not paste club crests into README deliverables.
- After build, check `stats.json` → `by_category` for `sports_*` coverage and `manual_study_gap_count` for documented absences.

## vs logo-design-skill library

| | **logo-kit-svg** | **logo-design-skill** |
|---|---|---|
| Use | README four-asset + kit workflow | General logo brainstorming |
| Logo study set | Simple Icons subset + logo-design-skill peer imports + `examples/` heroes | Full peer catalog (we import a missing-slug subset only) |
| Research | `search_library` + `search_examples` + gallery | Their search + classifications |
| Deliverables | Never paste library SVGs | Same study-only rule |

Use **logo-design** when identity exploration has no fixed 904×256 banner contract; use **this library** when researching OSS/repo marks and clichés for the Logo Kit pipeline.
