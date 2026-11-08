# Outlining strokes without an expand-stroke API

Production vector work usually wants strokes converted to filled outlines.
Monoline strokes are exactly what goes wrong at a sign-maker, a vinyl cutter, or
any pipeline that rescales geometry non-uniformly.

## Affinity's SDK cannot do it

Verified against **Affinity 3.2.3**: the JavaScript SDK has no expand-stroke
command. Every `outline` entry point is either the Outline *layer effect* (a
live effect, not geometry) or raster-selection outlining. `convertToCurves`
converts shape primitives to curves — it does not convert strokes to fills.

The SDK's own guidance suggests an external polygon clipper. That works, but it
is an approximation and a dependency.

## Compute the outlines instead

If your geometry is built from lines, arcs, circles and béziers — which most
geometric logo construction is — the offsets have exact closed forms. Computing
them beats approximating them.

Two tricks make the implementation short:

### 1. A round cap is exactly a half-disc

So you never need to construct cap arcs. Emit every stroke **butt-ended**, then
add a full circle at each free end. The buried half of the disc is harmless; the
visible half *is* the cap.

This collapses the hardest part of the problem into `<circle>` elements.

### 2. Emit each piece as its own element, not as subpaths

Overlapping subpaths inside one `<path>` interact through fill-rule winding. Two
solid shapes wound in opposite directions cancel where they overlap, punching an
unintended hole — which is exactly what happens where a stem meets its foot.

Separate `<path>` elements cannot interact. Emit one element per outlined piece
and the problem disappears. The only place you need two subpaths is an annulus
(a stroked full circle), where the hole is intentional — declare `evenodd`
explicitly there.

## Primitive by primitive

| Stroked input | Filled output |
| :-- | :-- |
| Straight line, butt cap | Rectangle from the two offset edges |
| Straight line, round cap | That rectangle, plus a disc at each end |
| Full circle | Annulus: outer circle + inner circle, `fill-rule="evenodd"` |
| Arc | Outer arc forward, line across, inner arc back, close |
| Arc, round cap | The above, plus a disc at each endpoint |
| Cubic bézier | Sample to a polyline, offset both sides, close; plus end discs |

For the bézier, sample density is a real tradeoff. Oversampling produces
absurd path-command counts (the validator will tell you). As a rule of thumb,
chord error is approximately `s² ÷ (8R)` for segment length `s` and curvature
radius `R` — at 16 samples per segment on a 64-unit grid that lands near 0.01
units, comfortably sub-pixel at any size a logo is used.

## Verify it, do not assume it

Outlining is a geometry rewrite. Confirm the result matches the original rather
than trusting that it does. A cheap and strict check: render both versions
stacked in HTML with `mix-blend-mode: difference`. Identical geometry produces
**pure black**; anything that glows is a real difference.

Expect a hairline of antialiasing at the edges — a stroke and a fill rasterise
their boundaries slightly differently. What matters is that the interiors come
back black, which means identical coverage.
