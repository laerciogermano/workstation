#!/usr/bin/env python3
"""Build library metadata from svg/ + taxonomy."""

from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "library"
SVG_DIR = LIB / "svg"
TAXONOMY = LIB / "taxonomy.json"
OVERRIDES = LIB / "taxonomy-overrides.json"
REGIONS = LIB / "regions.json"
CATALOG_OUT = LIB / "catalog.json"
CLASSIFICATIONS_OUT = LIB / "classifications.json"
STATS_OUT = LIB / "stats.json"
GALLERY_OUT = LIB / "gallery.html"


def _load_entries() -> tuple[dict, dict, list[dict]]:
    taxonomy = json.loads(TAXONOMY.read_text(encoding="utf-8"))
    raw_overrides = json.loads(OVERRIDES.read_text(encoding="utf-8")) if OVERRIDES.is_file() else {}
    manual_gaps = raw_overrides.get("$manual_study_gaps", {})
    overrides = {k: v for k, v in raw_overrides.items() if not k.startswith("$")}
    fallback = taxonomy.get("defaults", {}).get("tech_company", {})
    category_labels = taxonomy.get("categories", {})

    entries: list[dict] = []
    for path in sorted(SVG_DIR.glob("*.svg")):
        slug = path.stem
        override = overrides.get(slug, {})
        category = override.get("category", "tech_company")
        base = taxonomy.get("defaults", {}).get(category, fallback)
        meta = {**base, **override}
        row = {
            "slug": slug,
            "path": str(path.relative_to(ROOT)),
            "category": category,
            "category_label": category_labels.get(category, category),
            "mark_type": meta.get("mark_type", "wordmark"),
            "geometry": meta.get("geometry", "angular"),
            "color_family": meta.get("color_family", "brand-single"),
            "source": meta.get("source", "simple-icons"),
        }
        if override.get("region"):
            row["region"] = override["region"]
        if override.get("industry"):
            row["industry"] = override["industry"]
        entries.append(row)
    return taxonomy, category_labels, entries, manual_gaps


def _write_catalog(entries: list[dict]) -> None:
    catalog = {
        "version": 1,
        "generated": True,
        "count": len(entries),
        "entries": [{k: v for k, v in e.items() if k != "category_label"} for e in entries],
    }
    CATALOG_OUT.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")


def _write_classifications(entries: list[dict], taxonomy: dict) -> None:
    rows = []
    for e in entries:
        row = {
            "slug": e["slug"],
            "file": f"{e['slug']}.svg",
            "category": e["category"],
            "category_label": e["category_label"],
            "mark_type": e["mark_type"],
            "geometry": e["geometry"],
            "color_family": e["color_family"],
            "source": e["source"],
        }
        if e.get("region"):
            row["region"] = e["region"]
        if e.get("industry"):
            row["industry"] = e["industry"]
        rows.append(row)
    payload = {
        "version": 1,
        "generated": True,
        "taxonomy_version": taxonomy.get("version", 1),
        "dimensions": {
            "categories": taxonomy.get("categories", {}),
            "mark_types": taxonomy.get("mark_types", []),
            "geometry": taxonomy.get("geometry", []),
            "color_families": taxonomy.get("color_families", []),
            "optional_entry_fields": taxonomy.get("optional_entry_fields", {}),
        },
        "entries": rows,
    }
    CLASSIFICATIONS_OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _write_stats(entries: list[dict], category_labels: dict, manual_gaps: dict) -> None:
    svg_files = list(SVG_DIR.glob("*.svg"))
    last_sync = None
    if svg_files:
        newest = max(p.stat().st_mtime for p in svg_files)
        last_sync = datetime.fromtimestamp(newest, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    by_category = Counter(e["category"] for e in entries)
    by_region = Counter(e["region"] for e in entries if e.get("region"))
    by_industry = Counter(e["industry"] for e in entries if e.get("industry"))
    by_macro_region: dict[str, int] = {}
    if REGIONS.is_file():
        macro_map = json.loads(REGIONS.read_text(encoding="utf-8")).get("macro_regions", {})
        for macro, codes in macro_map.items():
            code_set = {c.lower() for c in codes}
            by_macro_region[macro] = sum(
                1 for e in entries if e.get("region") and e["region"].lower() in code_set
            )
    stats = {
        "version": 1,
        "generated": True,
        "built_at": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "last_sync_at": last_sync,
        "count": len(entries),
        "svg_files": len(svg_files),
        "by_category": {
            cat: {"count": by_category[cat], "label": category_labels.get(cat, cat)}
            for cat in sorted(by_category)
        },
        "by_mark_type": dict(sorted(Counter(e["mark_type"] for e in entries).items())),
        "by_geometry": dict(sorted(Counter(e["geometry"] for e in entries).items())),
        "by_color_family": dict(sorted(Counter(e["color_family"] for e in entries).items())),
        "by_region": dict(sorted(by_region.items())),
        "by_macro_region": dict(sorted(by_macro_region.items())),
        "by_industry": dict(sorted(by_industry.items())),
        "manual_study_gaps": manual_gaps,
        "manual_study_gap_count": len(manual_gaps),
    }
    STATS_OUT.write_text(json.dumps(stats, indent=2) + "\n", encoding="utf-8")


def _write_gallery(entries: list[dict], category_labels: dict) -> None:
    cats_json = json.dumps(category_labels, ensure_ascii=False)
    entries_json = json.dumps(
        [
            {
                "slug": e["slug"],
                "category": e["category"],
                "mark_type": e["mark_type"],
                "geometry": e["geometry"],
            }
            for e in entries
        ],
        ensure_ascii=False,
    )
    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Logo Kit SVG — reference library</title>
<style>
:root{{--bg:#f4f4f2;--card:#fff;--ink:#1a1a1a;--muted:#666;--line:#e0e0dc;--accent:#2563eb}}
*{{box-sizing:border-box}}
body{{margin:0;font:15px/1.45 system-ui,sans-serif;background:var(--bg);color:var(--ink)}}
header{{padding:1.25rem 1.5rem;border-bottom:1px solid var(--line);background:var(--card)}}
h1{{margin:0 0 .35rem;font-size:1.25rem}}
p{{margin:0;color:var(--muted);max-width:52rem}}
.toolbar{{display:flex;flex-wrap:wrap;gap:.5rem;padding:1rem 1.5rem;align-items:center}}
.toolbar label{{font-size:.85rem;color:var(--muted);margin-right:.25rem}}
select,button{{font:inherit;padding:.35rem .6rem;border:1px solid var(--line);border-radius:6px;background:var(--card)}}
button.active{{border-color:var(--accent);color:var(--accent)}}
#count{{margin-left:auto;font-size:.85rem;color:var(--muted)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1rem;padding:0 1.5rem 2rem}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.75rem;text-align:center}}
.card img{{width:72px;height:72px;object-fit:contain;display:block;margin:0 auto .5rem}}
.card .slug{{font-size:.8rem;font-weight:600;word-break:break-all}}
.card .meta{{font-size:.7rem;color:var(--muted);margin-top:.25rem}}
footer{{padding:1rem 1.5rem;border-top:1px solid var(--line);font-size:.8rem;color:var(--muted)}}
a{{color:var(--accent)}}
</style>
</head>
<body>
<header>
<h1>Reference library (study-only)</h1>
<p>Curated Simple Icons subset for trademark scale checks — not for pasting into deliverables. Regenerate via <code>python3 scripts/build_catalog.py</code>. Peer layout: <a href="https://github.com/kaankiziltug/logo-design-skill/tree/main/skills/logo-design/assets/library">logo-design-skill library</a>.</p>
</header>
<div class="toolbar">
<label for="cat">Category</label>
<select id="cat"><option value="">All</option></select>
<label for="mark">Mark type</label>
<select id="mark"><option value="">All</option></select>
<button type="button" id="reset">Reset</button>
<span id="count"></span>
</div>
<div class="grid" id="grid"></div>
<footer>See <code>library/TRADEMARKS.md</code> and <code>references/library-guide.md</code>.</footer>
<script>
const CATEGORIES = {cats_json};
const ENTRIES = {entries_json};
const grid = document.getElementById("grid");
const catSel = document.getElementById("cat");
const markSel = document.getElementById("mark");
const countEl = document.getElementById("count");
Object.keys(CATEGORIES).sort().forEach(c => {{
  const o = document.createElement("option");
  o.value = c; o.textContent = CATEGORIES[c] || c;
  catSel.appendChild(o);
}});
[...new Set(ENTRIES.map(e => e.mark_type))].sort().forEach(m => {{
  const o = document.createElement("option");
  o.value = m; o.textContent = m;
  markSel.appendChild(o);
}});
function render() {{
  const cat = catSel.value;
  const mark = markSel.value;
  const list = ENTRIES.filter(e => (!cat || e.category === cat) && (!mark || e.mark_type === mark));
  countEl.textContent = list.length + " / " + ENTRIES.length;
  grid.innerHTML = list.map(e => `
    <article class="card">
      <img src="svg/${{e.slug}}.svg" alt="" loading="lazy" width="72" height="72">
      <div class="slug">${{e.slug}}</div>
      <div class="meta">${{e.category}} · ${{e.mark_type}}</div>
    </article>`).join("");
}}
catSel.onchange = markSel.onchange = render;
document.getElementById("reset").onclick = () => {{ catSel.value = ""; markSel.value = ""; render(); }};
render();
</script>
</body>
</html>
"""
    GALLERY_OUT.write_text(html, encoding="utf-8")


def main() -> None:
    taxonomy, category_labels, entries, manual_gaps = _load_entries()
    if not entries:
        print("build_catalog: no SVG entries", file=sys.stderr)
        raise SystemExit(1)

    _write_catalog(entries)
    _write_classifications(entries, taxonomy)
    _write_stats(entries, category_labels, manual_gaps)
    _write_gallery(entries, category_labels)

    print(
        f"build_catalog: wrote {len(entries)} entries -> "
        f"{CATALOG_OUT.name}, {CLASSIFICATIONS_OUT.name}, {STATS_OUT.name}, {GALLERY_OUT.name}"
    )
    raise SystemExit(0)


if __name__ == "__main__":
    main()
