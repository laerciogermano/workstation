# XML Hygiene & Visual QA Gate

Every SVG file is strict XML. One unescaped symbol or invalid comment breaks rendering in GitHub, browsers, and `rsvg-convert`.

---

## 1. Mandatory XML Entity Table

Never place raw symbols inside SVG `<text>` or attribute strings. Always use these XML entities:

| Character | Raw (Forbidden in SVG) | XML Entity (Required) | Typical usage |
|---|---|---|---|
| Middle dot | `·` | `&#183;` | `CLI &#183; TUI &#183; Web` |
| Right arrow | `→` | `&#8594;` | `scan &#8594; diff &#8594; approve` |
| Checkmark | `✓` | `&#10003;` | `&#10003; Accepted` |
| Ampersand | `&` | `&amp;` | `Go &amp; Kafka` |
| Less than | `<` | `&lt;` | `&lt;= 5 hours` |
| Greater than | `>` | `&gt;` | `main -&gt; branch` |

### XML Comment Rule (No `--` Inside Comments)

XML forbids two consecutive hyphens (`--`) anywhere inside `<!-- ... -->`.
- **Broken:** `<!-- Background (--bg: #12100c) -->` -> fails with `xmlParseComment: '--' not allowed`.
- **Valid:** `<!-- Background (bg: #12100c) -->`.

---

## 2. Verification Commands (required)

Run from the skill root or target repository after writing or editing deliverable SVGs:

```bash
# 1. Skill rule audit (viewBox, script ban, reduced-motion, XML comments, raw UTF-8 in text)
python3 <skill-dir>/scripts/svg_audit_repo_logo.py assets/icon.svg assets/icon-animated.svg assets/logo.svg assets/logo-animated.svg

# 2. Strict XML parse (optional double-check)
xmllint --noout assets/icon.svg assets/icon-animated.svg assets/logo.svg assets/logo-animated.svg

# 3. Rasterize for visual inspection (prints PNG paths — open with image reader)
python3 <skill-dir>/scripts/render_qa.py --icon assets/icon.svg --banner assets/logo.svg

# 4. README embed check (target repo)
python3 <skill-dir>/scripts/check_readme_embed.py --target-repo
```

Legacy one-liners if scripts are unavailable:

```bash
rsvg-convert -w 1024 -h 1024 assets/icon.svg -o /tmp/logo-qa-icon.png
rsvg-convert -w 1808 -h 512 assets/logo.svg -o /tmp/logo-qa-banner.png
```

If `rsvg-convert` is not installed, fall back to ImageMagick or macOS QuickLook:

```bash
magick assets/icon.svg /tmp/logo-qa-icon.png
magick assets/logo.svg /tmp/logo-qa-banner.png
# or on macOS:
qlmanage -t -s 1024 -o /tmp assets/icon.svg assets/logo.svg
```

---

## 3. Visual QA Rubric (Inspect `/tmp/logo-qa-icon.png` and `/tmp/logo-qa-banner.png`)

Open both rendered PNGs with the file/image reader tool and score each criterion from `0` to `2`:

| Criterion | 0 (Fail) | 1 (Needs fix) | 2 (Pass) |
|---|---|---|---|
| **1. Palette accuracy** | Invented colors | Partial match | Every hex matches the app's theme tokens |
| **2. Flat background** | Scanlines, grid, or noisy gradient | Subtle unwanted stripe | Solid flat `--bg` fill (`#12100c`) |
| **3. Pill & text clearance** | Any letter (`W` in `Web`, etc.) clipped | Text touches pill border (`<4px`) | Every pill has `>=8px` horizontal padding |
| **4. Column separation** | Col 2 text touches Col 3 card | Tight (`<12px` gap) | Clean `>=24px` gutter between Col 2 and Col 3 |
| **5. Cursor alignment** | Overlaps wordmark last letter | Too far away (`>18px`) | Sits `6–10px` right of the wordmark |
| **6. Semantic diff colors** | N/A (column 3 ≠ `diff-hunks`) | Weak contrast when mode is `diff-hunks` | Distinct red `-` (`--del`) and green `+` (`--add`) hunks |
| **7. Complete 3-column story** | Bare wordmark only | Missing pipeline or icon | Icon + wordmark/pills + live terminal diff card |
| **8. XML & reduced-motion** | `xmllint` error or missing media query | Valid XML, no media query | Clean `xmllint` + `@media (prefers-reduced-motion: reduce)` |

**Passing threshold:** `15 / 16` minimum, and **no `0` or `1`** on Criteria 1, 2, 3, 6, or 8.
