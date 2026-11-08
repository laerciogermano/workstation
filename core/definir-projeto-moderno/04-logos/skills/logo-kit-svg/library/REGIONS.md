# Geography & industry tags (study shelf)

Optional `region` and `industry` fields live in `taxonomy-overrides.json` for Simple Icons slugs (not every logo-design-skill import). Regenerate counts via `python3 scripts/build_catalog.py` → `stats.json` → `by_region` / `by_macro_region` / `by_industry`.

## What `region` means

`region` is a **market tag for search and briefs** — which geography you are designing or researching *for* (home market, launch market, sales territory). It is **not** legal geography, HQ address, or trademark jurisdiction. A US-listed company can be tagged `cn` when the brief is China retail; EU-headquartered brands often share the coarse code `eu` until finer overrides land.

Only slugs with an explicit override appear in `by_region` counts (~150 tagged today; the rest of the shelf is untagged).

## Region codes (taxonomy `region`)

Counts below are **tagged slugs** from the latest `stats.json` `by_region` (re-run `build_catalog.py` after override changes). “Shelf slugs” are examples present under `library/svg/` that may still use a coarse tag (`eu` / `us`) or no tag.

### Active tags (in `by_region` today)

| Code | Tagged | Coverage / examples |
|------|--------|---------------------|
| `id` | 6 | Indonesia startups — Gojek, Grab, Bukalapak, Blibli, Shopee, Xendit |
| `my` | 2 | Malaysia — AirAsia, Boost, … |
| `sg` | 3 | Singapore — Singapore Airlines, Razer, Foodpanda, … |
| `jp` | 24 | Japan — Toyota, Sony, Rakuten, … |
| `cn` | 18 | China — Huawei, Xiaomi, Alipay, Alibaba Cloud, … |
| `kr` | 4 | Korea on Simple Icons — Samsung, Hyundai, Kia, LG, … |
| `eu` | 49 | Europe (coarse) — BMW, Siemens, Airbus, Accenture, … |
| `us` | 45 | United States — Ford, Boeing, Stripe, … |

### Documented market codes (shelf slugs; override optional)

Use these codes when adding overrides. Not every slug needs its own row — batch under `eu` / `us` until you need finer search.

| Code | Shelf slugs (examples) | Notes |
|------|------------------------|--------|
| `au` | atlassian, xero | ANZ; many AU brands still untagged |
| `nz` | xero | Often shares ANZ macro with `au` |
| `in` | — | Flipkart, Paytm, etc. not on current shelf |
| `th` | line | Agoda not in subset; ASEAN macro includes `th` |
| `vn` | — | VNG/FPT not in subset |
| `ph` | — | Globe/Smart not in subset |
| `tw` | — | ASUS, TSMC, etc. not in subset |
| `hk` | alibabacloud, alibabadotcom | Often tagged `cn` when override exists |
| `uk` | arm, rollsroyce, shell, vodafone | Many UK brands still tagged `eu` |
| `de` | bmw, siemens, sap, adidas, porsche, volkswagen, bosch, deutschetelekom | DACH; often tagged `eu` today |
| `fr` | airbus, renault, peugeot, orange, dassaultsystemes, schneiderelectric | Often tagged `eu` |
| `it` | ferrari, fiat | Often tagged `eu` |
| `es` | — | Telefónica, BBVA not in subset |
| `nl` | adyen | Philips Hue on shelf; ING/ASML not in subset |
| `br` | — | Nubank, Mercado Libre not in subset |
| `mx` | — | LATAM macro includes `mx` for future tags |
| `ca` | shopify | NA macro with `us` |
| `me` | — | MENA / Gulf — Emirates, Aramco not in subset |
| `za` | — | Africa south — future `emea` member |

Nordic markets (`se`, `no`, `fi`, `dk`) are listed under macro **nordics** in `library/regions.json`; no per-country overrides yet — Nordic brands on the shelf are usually tagged `eu`.

## Macro / sales regions

Macro names map to **member `region` codes** used in `taxonomy-overrides.json`. Source of truth: `library/regions.json` → `macro_regions`. After build, see `stats.json` → `by_macro_region` (counts slugs whose `region` is in the macro’s member set).

| Macro | Aliases | Member `region` codes | Tagged slugs* |
|-------|---------|------------------------|---------------|
| `emea` | — | `eu`, `uk`, `me`, `za`, `de`, `fr`, `it`, `es`, `nl` | 49 (`eu` only today) |
| `apj` | — | `jp`, `cn`, `kr`, `id`, `sg`, `my`, `au`, `nz`, `in`, `th`, `vn`, `ph`, `tw`, `hk` | 56 |
| `apac` | same as APJ | same as `apj` | 56 |
| `amer` | — | `us`, `ca` | 45 (`us` only today) |
| `na` | North America | `us`, `ca` | 45 |
| `latam` | — | `br`, `mx` | 0 |
| `mena` | — | `me` | 0 |
| `asean` | — | `id`, `my`, `sg`, `th`, `vn`, `ph` | 10 |
| `anz` | — | `au`, `nz` | 0 |
| `dach` | — | `de` | 0 (use `eu` or add `de` overrides) |
| `nordics` | — | `se`, `no`, `fi`, `dk` | 0 |

\*Tagged slug counts from build when only `eu`/`us`/… coarse tags exist; re-run `build_catalog.py` after retagging.

## Search

```bash
python3 scripts/search_library.py --region jp --industry automotive --summary
python3 scripts/search_library.py --region id --summary
python3 scripts/search_library.py --macro emea --summary
python3 scripts/search_library.py --macro asean --industry fintech --summary
```

`--macro` expands to an OR over member codes (mutually exclusive with `--region`). Unknown macros error with the list from `regions.json`.

Or grep generated rows: `jq '.entries[] | select(.region=="eu")' library/classifications.json`

## Gaps (not on Simple Icons)

Many SEA brands are **not** in Simple Icons — do not scrape; note in brief / `$manual_study_gaps` if needed:

- **Indonesia startups (no SI slug):** Tokopedia, Traveloka, OVO, Dana, GoPay, LinkAja, Jenius, Midtrans, Halodoc, Ajaib, Bibit, Tiket.com, Lazada (regional), GoTo, JD.ID, **Astro (quick-commerce)** — see `astroindonesia` in `$manual_study_gaps` (SI `astro` is [astro.build](https://astro.build), not Astro ID).
- **Other:** Telkomsel, Nintendo, Deloitte, McKinsey, most US big-box and pharma marks.

Regional shelf gaps (no SVG in `library/svg/` today): most of `in`, `vn`, `ph`, `tw`, `br`, `mx`, `me`, `za`, `es` example brands above — document for briefs; add via `library-slugs.txt` + sync when SI has the slug.
