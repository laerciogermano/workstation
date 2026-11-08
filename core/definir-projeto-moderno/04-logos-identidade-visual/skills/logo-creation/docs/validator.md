# Validator reference

`scripts/validate_svg.py` — dependency-free structural checks for logo SVGs.

```bash
python scripts/validate_svg.py out/logo/
python scripts/validate_svg.py out/logo/icon-color.svg
python scripts/validate_svg.py out/logo/ --icon-size 16 --lockup-size 120
```

Exit codes: `0` clean, `1` at least one error, `2` bad invocation.

## What it cannot do

It checks structure, not design. A validator cannot tell you a mark is
forgettable, derivative, or wrong for the brand. **Passing it is necessary, not
sufficient** — the four perceptual tests in
[`../references/validation.md`](../references/validation.md) do the other half,
and they need human eyes.

This distinction is not academic. During development, a wordmark passed the
validator with zero errors while being visibly broken: a malformed `s` and
spacing so uneven the word read as three fragments. Structure was fine; the
design was not.

## Errors

Errors block. Each one makes the file unfit for production.

| Check | Why it matters |
| :-- | :-- |
| Missing or malformed `viewBox` | The mark will not scale to its container |
| `<image>` or base64 raster in `href` | A logo containing a bitmap is not a logo |
| External `http(s)` reference | Breaks the moment it is used offline or the host moves |
| `<script>` | Has no place in a logo file |
| Live `<text>` or `<tspan>` | Renders differently on every machine lacking the font |
| `<filter>` | Does not survive print, favicon rasterisation, or embroidery |
| `<foreignObject>` | Same |
| Stroke below the render floor | Renders under one pixel and disappears |
| Not valid XML / wrong root element | Self-explanatory |

## Warnings

Warnings never fail the run, but the skill's Phase 6 gate requires a **written
justification** for each. "It's fine" is not a justification.

| Check | Threshold |
| :-- | :-- |
| Fixed `width`/`height` on the master | Any |
| Missing `<title>` and `aria-label` | Any |
| `<mask>` / `<clipPath>` | Any — unreliable across rasterisers |
| Single path complexity | > 120 commands |
| Total path complexity | > 400 commands |
| File size | > 30,000 bytes |
| Stroke close to the floor | < 1.25× the floor |
| Off-colour single-colour variant | `-black` not pure `#000000`, `-white` not pure `#ffffff` |

The path-complexity warning earns its keep: it caught a legitimately
over-detailed curve during development, where a bézier had been flattened at 48
samples per segment producing 195 path commands. Sixteen samples put the chord
error at roughly 0.01 units — about 0.14 px even at a 1024 px render — and the
warning cleared.

## The component-aware stroke floor

The most important behaviour in the script, and the one that had to be fixed.

A stroke thinner than `viewBox_width ÷ render_width_px` renders below one pixel
and vanishes. But **the render width is not the same for every component.** An
icon has to survive 16 px. A horizontal lock-up never appears at 16 px wide —
judging it against a favicon floor produces confident, wrong failures.

The floor is therefore chosen per component:

| Component (from filename) | Default floor |
| :-- | :-- |
| `icon-*`, `favicon`, `symbol-*`, `mark-*`, `app-*` | 16 px |
| `wordmark-*`, `horizontal-*`, `stacked-*`, `lockup-*` | 120 px |
| Unrecognised, aspect ratio > 2.5 | 120 px (treated as a lock-up) |
| Unrecognised, otherwise | 16 px (treated as an icon) |

This is why the naming convention in
[`../references/deliverables.md`](../references/deliverables.md) is not
cosmetic — the validator reads it. Override with `--icon-size` and
`--lockup-size`.

## Notes

- Console output is deliberately ASCII-only so messages do not mojibake on a
  cp1252 Windows console. There is a test asserting this.
- The script reports a `note` (neither error nor warning) for stroked geometry
  without explicit `stroke-linecap`/`stroke-linejoin`, since renderer defaults
  vary. Outlining strokes to fills removes the question entirely — see
  [outlining-strokes.md](outlining-strokes.md).
