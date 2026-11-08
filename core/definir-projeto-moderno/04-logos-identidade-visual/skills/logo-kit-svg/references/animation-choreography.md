# Animation Choreography (GitHub-Safe CSS Keyframes)

GitHub README images (`<img src="assets/logo-animated.svg">`) are served as standalone image documents. External stylesheets and `<script>` tags are blocked, but inline `<defs><style>@keyframes ...</style></defs>` animations run natively in every modern browser.

---

## 1. Core Animation Rules

1. **One shared loop duration per file:**
   - `assets/icon-animated.svg`: every animated class uses `4.6s` infinite.
   - `assets/logo-animated.svg`: every workflow class uses `6s` infinite (except `.cursor-block`, which blinks at `1.1s steps(2, start) infinite`).
2. **Split static trunk from animated curve:**
   - In the static SVG, `M 104 126 L 104 196 C ...` can be one `<path>`.
   - In the animated SVG, split the vertical trunk (`<line x1="104" y1="126" x2="104" y2="196" ... />`) from the curved branch (`<path class="branch-curve" d="M 104 196 C 104 252, 138 289, 184 289" ... />`) so the curve draws cleanly out of the fork node!
3. **Set explicit `transform-origin` in local SVG pixel coordinates:**
   - Whenever an element scales (`scale(...)`), set `transform-origin: <center_x>px <center_y>px;` matching its center inside its parent `<g>`.
   - Without an explicit pixel `transform-origin`, SVG elements scale from `(0, 0)` of the canvas and fly across the screen.
4. **Hold the finished state for 25%+ of the cycle (`64%–88%`):**
   - Never animate continuously without a rest phase. Viewers need ~1.5 seconds of still frame to read the diff and pipeline.
5. **Always include `@media (prefers-reduced-motion: reduce)`:**
   - Force `animation: none !important; stroke-dashoffset: 0 !important; opacity: 1 !important; transform: none !important;`.

### Concentric / orbit marks (`logo-kit-svg` default)

When column-1 is **rings + core** (not a diff tree), use staged draws instead of opacity breathing:

| Phase | Icon `4.6s` | Banner `6s` |
|-------|-------------|-------------|
| Outer ring draws | `.outer-draw` `stroke-dasharray ≈ 2πr` | `.col1-outer`, `.sketch-outer` |
| Inner ring draws | `.inner-draw` (delayed) | `.col1-inner`, `.sketch-inner` |
| Core pops | `.core-dot` at mark center | `.col1-core`, `.mark-shell` |
| Motion accent | `.orbit-arc` + `.orbit-tip` (quarter arc on outer radius) | `.flow-dot` translate sketch→mark; pills swap still/motion |

`stroke-dasharray` ≈ `round(2 * π * r)` for a circle. Orbit arc: `d="M cx (cy-r) A r r 0 0 1 (cx+r) cy"`. Canonical demo: `examples/logo-kit-svg/icon-animated.svg`, `logo-animated.svg`.

---

## 2. Choreography Table (`6s` Banner Loop)

| Time window | Keyframe % | Visual event | Easing |
|---|---|---|---|
| `0.0s – 1.1s` | `0% – 18%` | `.stage-scan` highlights in `--accent` (`#ffb454`) | `ease-in-out` |
| `0.4s – 1.4s` | `6% – 24%` | `.icon-branch-path` draws (`stroke-dashoffset: 80 -> 0`); `.del-row` pulses `0.35 -> 1` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `1.1s – 2.4s` | `18% – 40%` | `.stage-diff` highlights in `--accent`; `.add-row` & `.icon-add-row` slide in | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `2.3s – 3.2s` | `38% – 54%` | `.stage-approve` turns green (`#9ccb5a`); `.approve-badge` & `.icon-seal` pop in | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) |
| `3.2s – 3.8s` | `54% – 64%` | `.pdf-pill` scales in (`0.98 -> 1`, `opacity: 0.3 -> 1`) | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `3.8s – 5.3s` | `64% – 88%` | **Reading hold** (all elements at full opacity and resting position) | flat hold |
| `5.3s – 6.0s` | `88% – 100%` | Smooth reset to initial state for seamless loop | `ease-in-out` |

---

## 3. Ready-to-Use `<defs><style>` for `assets/icon-animated.svg` (`4.6s`)

Attach these classes to the static `icon.svg` elements:
- `.branch-curve` on the curved `<path d="M 104 196 C 104 252, 138 289, 184 289" ...>`
- `.del-hunk` on the deleted hunk `<g>`
- `.del-strike` on the strikethrough `<line>` inside `.del-hunk`
- `.add-hunk` on the added hunk `<g>`
- `.target-node` on a `<g>` wrapping `<circle cx="184" cy="289" r="12" ... />`
- `.seal-badge` on a `<g>` wrapping the bottom-right approval seal (`cx="394" cy="390"`)

```xml
  <defs>
    <style>
      .branch-curve {
        stroke-dasharray: 220;
        stroke-dashoffset: 220;
        animation: draw-branch 4.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
      }
      .del-hunk {
        transform-origin: 291px 218px;
        animation: del-pulse 4.6s ease-in-out infinite;
      }
      .del-strike {
        stroke-dasharray: 160;
        stroke-dashoffset: 160;
        animation: strike-line 4.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
      .add-hunk {
        transform-origin: 291px 289px;
        animation: add-reveal 4.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
      }
      .target-node {
        transform-origin: 184px 289px;
        animation: node-pop 4.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
      }
      .seal-badge {
        transform-origin: 394px 390px;
        animation: seal-pop 4.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
      }

      @keyframes draw-branch {
        0%, 8% { stroke-dashoffset: 220; }
        28%, 86% { stroke-dashoffset: 0; }
        96%, 100% { stroke-dashoffset: 220; }
      }
      @keyframes del-pulse {
        0%, 10% { opacity: 0.45; }
        22%, 86% { opacity: 1; }
        96%, 100% { opacity: 0.45; }
      }
      @keyframes strike-line {
        0%, 14% { stroke-dashoffset: 160; }
        32%, 86% { stroke-dashoffset: 0; }
        96%, 100% { stroke-dashoffset: 160; }
      }
      @keyframes add-reveal {
        0%, 20% { opacity: 0.2; transform: translateX(-8px) scale(0.97); }
        38%, 86% { opacity: 1; transform: translateX(0) scale(1); }
        96%, 100% { opacity: 0.2; transform: translateX(-8px) scale(0.97); }
      }
      @keyframes node-pop {
        0%, 22% { transform: scale(0); opacity: 0; }
        36%, 86% { transform: scale(1); opacity: 1; }
        96%, 100% { transform: scale(0); opacity: 0; }
      }
      @keyframes seal-pop {
        0%, 40% { transform: scale(0.6); opacity: 0; }
        54%, 86% { transform: scale(1); opacity: 1; }
        96%, 100% { transform: scale(0.6); opacity: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .branch-curve, .del-hunk, .del-strike, .add-hunk, .target-node, .seal-badge {
          animation: none !important;
          stroke-dashoffset: 0 !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    </style>
  </defs>
```

---

## 4. Ready-to-Use `<defs><style>` for `assets/logo-animated.svg` (`6s`)

Attach these classes to the static `logo.svg` elements:
- `.cursor-block` on the wordmark cursor `<rect>`
- `.icon-branch-path` on the mini-icon curved branch `<path d="M 22 52 C 22 69, 33 81, 48 81" ...>`
- `.icon-add-row` on `<g>` wrapping the mini-icon green `+` hunk
- `.icon-seal` on `<g>` wrapping the mini-icon approval seal (`cx="110" cy="108"`)
- `.del-row` on `<g>` wrapping the terminal card's red `-` hunk row
- `.add-row` on `<g>` wrapping the terminal card's green `+` hunk row
- `.approve-badge` on `<g>` wrapping the `✓ Accepted` chip inside `.add-row`
- `.stage-scan`, `.stage-diff`, `.stage-approve` on the 3 stage `<text>` nodes in the bottom pipeline bar
- `.pdf-pill` on `<g>` wrapping the bottom-right `output/...pdf` pill

```xml
  <defs>
    <style>
      .cursor-block {
        animation: cursor-blink 1.1s steps(2, start) infinite;
      }
      .icon-branch-path {
        stroke-dasharray: 80;
        stroke-dashoffset: 80;
        animation: icon-branch-draw 6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
      }
      .icon-add-row {
        transform-origin: 78px 81px;
        animation: icon-add-pop 6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
      }
      .icon-seal {
        transform-origin: 110px 108px;
        animation: icon-seal-pop 6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
      }
      .del-row {
        animation: term-del 6s ease-in-out infinite;
      }
      .add-row {
        transform-origin: 212px 129px;
        animation: term-add 6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
      }
      .approve-badge {
        transform-origin: 152px 139.5px;
        animation: badge-accept 6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
      }
      .pdf-pill {
        transform-origin: 297px 196px;
        animation: pdf-build 6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
      }
      .stage-scan {
        animation: pulse-scan 6s ease-in-out infinite;
      }
      .stage-diff {
        animation: pulse-diff 6s ease-in-out infinite;
      }
      .stage-approve {
        animation: pulse-approve 6s ease-in-out infinite;
      }

      @keyframes cursor-blink {
        0%, 49% { opacity: 0.9; }
        50%, 100% { opacity: 0.15; }
      }
      @keyframes icon-branch-draw {
        0%, 6% { stroke-dashoffset: 80; }
        24%, 88% { stroke-dashoffset: 0; }
        96%, 100% { stroke-dashoffset: 80; }
      }
      @keyframes icon-add-pop {
        0%, 16% { opacity: 0.25; transform: translateX(-4px); }
        30%, 88% { opacity: 1; transform: translateX(0); }
        96%, 100% { opacity: 0.25; transform: translateX(-4px); }
      }
      @keyframes icon-seal-pop {
        0%, 42% { opacity: 0; transform: scale(0.5); }
        54%, 88% { opacity: 1; transform: scale(1); }
        96%, 100% { opacity: 0; transform: scale(0.5); }
      }
      @keyframes term-del {
        0%, 10% { opacity: 0.35; }
        22%, 88% { opacity: 1; }
        96%, 100% { opacity: 0.35; }
      }
      @keyframes term-add {
        0%, 18% { opacity: 0.15; transform: translateY(4px); }
        32%, 88% { opacity: 1; transform: translateY(0); }
        96%, 100% { opacity: 0.15; transform: translateY(4px); }
      }
      @keyframes badge-accept {
        0%, 38% { opacity: 0.2; transform: scale(0.92); }
        48%, 88% { opacity: 1; transform: scale(1); }
        96%, 100% { opacity: 0.2; transform: scale(0.92); }
      }
      @keyframes pdf-build {
        0%, 54% { opacity: 0.3; transform: scale(0.98); }
        64%, 88% { opacity: 1; transform: scale(1); }
        96%, 100% { opacity: 0.3; transform: scale(0.98); }
      }
      @keyframes pulse-scan {
        0%, 18% { fill: #ffb454; }
        20%, 100% { fill: #a99b83; }
      }
      @keyframes pulse-diff {
        0%, 16% { fill: #6f6555; }
        18%, 40% { fill: #ffb454; }
        42%, 100% { fill: #a99b83; }
      }
      @keyframes pulse-approve {
        0%, 38% { fill: #6f6555; }
        42%, 90% { fill: #9ccb5a; }
        95%, 100% { fill: #6f6555; }
      }

      @media (prefers-reduced-motion: reduce) {
        .cursor-block, .icon-branch-path, .icon-add-row, .icon-seal,
        .del-row, .add-row, .approve-badge, .pdf-pill,
        .stage-scan, .stage-diff, .stage-approve {
          animation: none !important;
          stroke-dashoffset: 0 !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    </style>
  </defs>
```
