# Contact sheet reference

`scripts/build_contact_sheet.py` — turns a directory of logo SVGs into one
self-contained HTML page for running the four perceptual tests.

```bash
python scripts/build_contact_sheet.py out/logo/ --name "Brand Name"
python scripts/build_contact_sheet.py out/logo/ --name "Acme" --out sheet.html
```

The output has **no network dependencies**. Every SVG is inlined; there are no
external stylesheets, scripts, or fonts. It opens from `file://` and works
offline, on a plane, in a client meeting with bad wifi.

## What it renders

| Section | Purpose |
| :-- | :-- |
| Variant gallery | Every file on both light and dark |
| Test 1 — 16 pixels | Favicon strip at 16 / 24 / 32 / 48 / 64 px |
| Test 2 — grayscale and single colour | Grayscale pair, pure black on white, pure white on dark |
| Test 3 — blur | Three intensities (1 px, 2 px, 4 px) |
| Test 4 — 5-second recall | Interactive timer: shows the mark for 5 s, then hides it |
| Scale ramp | The lock-up from favicon to signage width |

It is a **viewing instrument, not a deliverable.** Its only job is to make
failures impossible to miss. Generating it and not looking at it is worse than
useless, because it creates a false sense of having tested something.

## Filenames matter

Variants are ordered by component, then by colour variant, using the naming
convention in [`../references/deliverables.md`](../references/deliverables.md):

```
<component>-<variant>.svg
```

Components sort as `favicon`, `icon`, `wordmark`, `horizontal`, `stacked`;
variants as `color`, `black`, `white`, `darkmode`. Unrecognised names still
render — they just sort last.

The small-size tests use the first file matching `icon*` or `favicon*`, and the
scale ramp prefers `horizontal*`. Both fall back to the first file present.

## Two implementation details worth knowing

Both of these were bugs, and both produced output that looked plausible while
being wrong.

### Filters go on the mark, never the tile

Applying a CSS filter to the tile container transforms its **background** along
with the mark. `brightness(0)` on the tile turns the whole card into a solid
black rectangle, and blur bleeds past the tile edge. The rules target
`.fx-black .mark`, not `.fx-black`.

### Element ids are namespaced per instance

The same SVG is inlined many times on one page. Any `id` inside it — a gradient,
a `clipPath` — would collide across instances, and every reference would resolve
to whichever copy appeared first. Each inlined instance gets its ids rewritten
with a per-instance prefix.

Relatedly, only the **root** `<svg>` element has its `width`/`height` stripped.
Stripping those attributes globally would gut the geometry of any inner `<rect>`.

## Running the tests

See [`../references/validation.md`](../references/validation.md) for what each
test catches and how to score it. The short version: be strict, and treat a
failure as a reason to return to the design rather than to lower the bar.
