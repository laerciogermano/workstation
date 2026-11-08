# SVG Coordinate Blueprints

Exact coordinate systems and copy-pasteable SVG skeletons for the 4-asset suite. Every coordinate is tested to prevent text clipping and column collisions.

**Column 3 is not always a diff terminal.** Choose mode first: [banner-column-3.md](banner-column-3.md). Blueprints below center on **`diff-hunks`** (ApplyDiff-style); adapt column 3 (and drop mini hunks on the icon) for `product-card`, `feature-summary`, `metrics`, or `minimal`.

---

## 1. Typography & Font Stacks

Always use system-safe fallbacks after the primary fonts so `rsvg-convert`, GitHub, and browsers render identical metrics:

- **Sans-serif (wordmark & motto):**
  `font-family="IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"`
- **Monospace (tagline, pills, terminal diff, pipeline):**
  `font-family="IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"`

### Width Math (Preventing Truncated Text)

Never guess pill or chip widths. Compute them from the character count before writing `<rect>`:

| Element | Font size | Formula | Example (`CLI · TUI · Web`, 15 chars) |
|---|---|---|---|
| Feature pill with leading dot | `11px` mono (`600`) | `width = ceil(chars × 7.2) + 26` | `15 × 7.2 + 26 = 134` (use `132–136`) |
| Feature pill without dot | `11px` mono (`600`) | `width = ceil(chars × 7.2) + 22` | `+hunk review` (12 chars) -> `100` |
| Topbar branch chip (with dot) | `10.5px` mono (`600`) | `width = ceil(chars × 6.8) + 28` | `branch: honor/sr-backend` (24 chars) -> `176` |
| Pipeline output pill | `10px` mono (`600`) | `width = ceil(chars × 6.4) + 18` | `output/2026-10-17-honor-sr.pdf` (30 chars) -> `210–230` |
| Wordmark cursor `x` position | `38px` sans (`700`) | `cursor_x = 184 + ceil(chars × 20.2)` | `ApplyDiff` (9 chars) -> `364` |

**Column 2 clearance rule:**
- Column 2 starts at `x = 184`.
- Column 3 starts at `x = 456`.
- Maximum allowed width for any element in Column 2 is `456 - 184 - 24 = 248px`.
- Keep `pill_1_width + 8 + pill_2_width <= 248`.

---

## 2. Blueprint A: Standalone Square Icon (`assets/icon.svg`, `512×512`)

### Spatial Grid

| Region | Coordinates | Purpose |
|---|---|---|
| Canvas | `viewBox="0 0 512 512"` | Square icon canvas |
| Outer Squircle | `x="24" y="24" width="464" height="464" rx="104"` | Flat `--bg` container with `6px` `--line` border |
| Git / Pipeline Spine | `x="104"`, `y="126..380"` | Left vertical trunk (`stroke-width="12"`, `--line2`) |
| Active Branch Curve | `M 104 126 L 104 196 C 104 252, 138 289, 184 289` | Curved `--accent` branch (`stroke-width="13"`) into `+` hunk |
| Commit Nodes | `(104,126)`, `(104,196)`, `(184,289)`, `(104,380)` | Base CV, fork point, green target node, main history |
| Document Sheet | `x="158..424"`, `y="84..428"`, folded corner `356,84 -> 424,152` | `--surface` card (`stroke="#3d372c" stroke-width="5"`) |
| Document Header | `y="118..174"` | Accent dot (`198,126`), title bar, subtitle bar, divider line |
| Red Deleted Hunk (`-`) | `x="184" y="192" width="214" height="52" rx="12"` | `--del-bg` fill, `--del` left bar, `-` glyph, strikethrough line |
| Green Added Hunk (`+`) | `x="184" y="260" width="214" height="58" rx="12"` | `--add-bg` fill, `--add` left bar, `+` glyph, `--accent` tag |
| Context Lines | `x="190"`, `y="340, 362, 384"` | Three `--dim` rounded bars (`opacity="0.6, 0.4, 0.25"`) |
| Approval Seal Badge | `cx="394" cy="390" r="28"` | Bottom-right seal with `--accent` checkmark |

### Complete Template (`assets/icon.svg`)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none" role="img" aria-label="ApplyDiff Icon">
  <!-- Solid Flat Application Background (bg: #12100c, line: #2f2a21) -->
  <rect x="24" y="24" width="464" height="464" rx="104" fill="#12100c" stroke="#2f2a21" stroke-width="6" />

  <!-- CV Document Card (surface: #1a1712, line2: #3d372c) -->
  <path d="M 184 84 H 356 L 424 152 V 402 A 26 26 0 0 1 398 428 H 184 A 26 26 0 0 1 158 402 V 110 A 26 26 0 0 1 184 84 Z"
        fill="#1a1712" stroke="#3d372c" stroke-width="5" stroke-linejoin="round" />
  <!-- Folded Corner Flap (surface2: #221e17) -->
  <path d="M 356 84 V 130 A 22 22 0 0 0 378 152 H 424 Z"
        fill="#221e17" stroke="#3d372c" stroke-width="5" stroke-linejoin="round" />

  <!-- CV Header Section (accent: #ffb454, fg: #f0e6d2, muted: #a99b83) -->
  <circle cx="198" cy="126" r="7" fill="#ffb454" />
  <rect x="214" y="118" width="116" height="16" rx="8" fill="#f0e6d2" />
  <rect x="190" y="146" width="92" height="10" rx="5" fill="#a99b83" opacity="0.75" />
  <line x1="186" y1="174" x2="394" y2="174" stroke="#2f2a21" stroke-width="3.5" stroke-linecap="round" />

  <!-- Hunk 1: Deleted Line (-) (del-bg: #2a1712, del: #e5644e) -->
  <g>
    <rect x="184" y="192" width="214" height="52" rx="12" fill="#2a1712" stroke="#e5644e" stroke-opacity="0.5" stroke-width="2.5" />
    <rect x="184" y="201" width="6" height="34" rx="3" fill="#e5644e" />
    <rect x="202" y="215.5" width="16" height="5" rx="2.5" fill="#e5644e" />
    <rect x="230" y="212" width="104" height="12" rx="6" fill="#e5644e" opacity="0.45" />
    <rect x="342" y="212" width="38" height="12" rx="6" fill="#e5644e" opacity="0.3" />
    <line x1="227" y1="218" x2="383" y2="218" stroke="#e5644e" stroke-width="2.5" stroke-linecap="round" opacity="0.85" />
  </g>

  <!-- Hunk 2: Added / Tailored Line (+) (add-bg: #1d2412, add: #9ccb5a, accent: #ffb454) -->
  <g>
    <rect x="184" y="260" width="214" height="58" rx="12" fill="#1d2412" stroke="#9ccb5a" stroke-opacity="0.8" stroke-width="2.5" />
    <rect x="184" y="269" width="6" height="40" rx="3" fill="#9ccb5a" />
    <rect x="201" y="286.5" width="18" height="5" rx="2.5" fill="#9ccb5a" />
    <rect x="207.5" y="280" width="5" height="18" rx="2.5" fill="#9ccb5a" />
    <rect x="230" y="277" width="122" height="11" rx="5.5" fill="#9ccb5a" />
    <rect x="360" y="277" width="22" height="11" rx="5.5" fill="#ffb454" />
    <rect x="230" y="295" width="88" height="9" rx="4.5" fill="#9ccb5a" opacity="0.65" />
  </g>

  <!-- Unchanged Context Lines (dim: #6f6555) -->
  <rect x="190" y="340" width="156" height="10" rx="5" fill="#6f6555" opacity="0.6" />
  <rect x="190" y="362" width="112" height="10" rx="5" fill="#6f6555" opacity="0.4" />
  <rect x="190" y="384" width="134" height="10" rx="5" fill="#6f6555" opacity="0.25" />

  <!-- Git Branch Spine (line2: #3d372c, accent: #ffb454) -->
  <line x1="104" y1="196" x2="104" y2="380" stroke="#3d372c" stroke-width="12" stroke-linecap="round" />
  <path d="M 104 126 L 104 196 C 104 252, 138 289, 184 289"
        stroke="#ffb454" stroke-width="13" stroke-linecap="round" fill="none" />

  <!-- Commit Nodes -->
  <circle cx="104" cy="126" r="18" fill="#12100c" stroke="#ffb454" stroke-width="9" />
  <circle cx="104" cy="126" r="5" fill="#f0e6d2" />
  <circle cx="104" cy="196" r="14" fill="#ffb454" stroke="#12100c" stroke-width="5" />
  <circle cx="184" cy="289" r="12" fill="#9ccb5a" stroke="#12100c" stroke-width="5" />
  <circle cx="104" cy="380" r="15" fill="#12100c" stroke="#3d372c" stroke-width="8" />

  <!-- Approved Hunk Seal Badge -->
  <circle cx="394" cy="390" r="28" fill="#1a1712" stroke="#ffb454" stroke-width="4" />
  <circle cx="394" cy="390" r="21" fill="#2a1a0e" />
  <path d="M 383 390.5 L 390.5 398 L 406 382.5" stroke="#ffb454" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

---

## 3. Blueprint B: 3-Column Hero Logo Banner (`assets/logo.svg`, `904×256`)

### Spatial Grid

| Column | Coordinates | Contents |
|---|---|---|
| Outer Banner | `x="2" y="2" width="900" height="252" rx="18"` | Flat `--bg` container with `2px` `--line` border |
| Col 1: Mini Icon | `transform="translate(28, 60)"` (`136×136`) | Rounded `rx="32"` `--surface` tile holding the mini icon |
| Col 2: Wordmark & Copy | `x="184..432"`, `y="78..204"` | Wordmark (`y=106`), cursor (`y=78`), tagline (`y=134`), pills (`y=152`), motto (`y=200`) |
| Col 3: Terminal Card | `transform="translate(456, 22)"` (`424×212`) | Topbar (`h=36`), diff rows (`y=58..170`), bottom pipeline bar (`y=180..212`) |

### Complete Template (`assets/logo.svg`)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 904 256" width="904" height="256" fill="none" role="img" aria-label="ApplyDiff - git diff for your CV">
  <!-- Solid Flat Application Background (bg: #12100c, line: #2f2a21) -->
  <rect x="2" y="2" width="900" height="252" rx="18" fill="#12100c" stroke="#2f2a21" stroke-width="2" />

  <!-- LEFT: ICON MARK -->
  <g transform="translate(28, 60)">
    <rect x="0" y="0" width="136" height="136" rx="32" fill="#1a1712" stroke="#2f2a21" stroke-width="2" />

    <!-- Mini Document -->
    <path d="M 48 18 H 98 L 116 36 V 108 A 8 8 0 0 1 108 116 H 48 A 8 8 0 0 1 40 108 V 26 A 8 8 0 0 1 48 18 Z"
          fill="#221e17" stroke="#3d372c" stroke-width="2" stroke-linejoin="round" />
    <path d="M 98 18 V 30 A 6 6 0 0 0 104 36 H 116 Z"
          fill="#2f2a21" stroke="#3d372c" stroke-width="1.5" stroke-linejoin="round" />

    <!-- Header lines -->
    <circle cx="53" cy="31" r="2.5" fill="#ffb454" />
    <rect x="59" y="28.5" width="32" height="5" rx="2.5" fill="#f0e6d2" />
    <rect x="50" y="37" width="24" height="3.5" rx="1.75" fill="#a99b83" opacity="0.7" />
    <line x1="48" y1="45" x2="108" y2="45" stroke="#2f2a21" stroke-width="1.5" stroke-linecap="round" />

    <!-- Deleted Hunk (-) (del-bg: #2a1712, del: #e5644e) -->
    <rect x="48" y="51" width="60" height="16" rx="4" fill="#2a1712" stroke="#e5644e" stroke-opacity="0.5" stroke-width="1" />
    <rect x="48" y="54" width="2.5" height="10" rx="1.25" fill="#e5644e" />
    <rect x="54" y="58" width="5" height="2" rx="1" fill="#e5644e" />
    <rect x="63" y="57" width="38" height="4" rx="2" fill="#e5644e" opacity="0.5" />
    <line x1="62" y1="59" x2="102" y2="59" stroke="#e5644e" stroke-width="1.2" stroke-linecap="round" />

    <!-- Added Hunk (+) (add-bg: #1d2412, add: #9ccb5a, accent: #ffb454) -->
    <rect x="48" y="72" width="60" height="18" rx="4" fill="#1d2412" stroke="#9ccb5a" stroke-opacity="0.8" stroke-width="1.2" />
    <rect x="48" y="75" width="2.5" height="12" rx="1.25" fill="#9ccb5a" />
    <rect x="53.5" y="80" width="6" height="2" rx="1" fill="#9ccb5a" />
    <rect x="55.5" y="78" width="2" height="6" rx="1" fill="#9ccb5a" />
    <rect x="63" y="79" width="30" height="4" rx="2" fill="#9ccb5a" />
    <rect x="96" y="79" width="7" height="4" rx="2" fill="#ffb454" />

    <!-- Context lines -->
    <rect x="50" y="96" width="42" height="3.5" rx="1.75" fill="#6f6555" opacity="0.6" />
    <rect x="50" y="103" width="28" height="3.5" rx="1.75" fill="#6f6555" opacity="0.4" />

    <!-- Git Branch Graph -->
    <line x1="22" y1="32" x2="22" y2="104" stroke="#3d372c" stroke-width="4" stroke-linecap="round" />
    <path d="M 22 32 L 22 52 C 22 69, 33 81, 48 81" stroke="#ffb454" stroke-width="4.2" stroke-linecap="round" fill="none" />
    <circle cx="22" cy="32" r="5.5" fill="#1a1712" stroke="#ffb454" stroke-width="3" />
    <circle cx="22" cy="52" r="4" fill="#ffb454" stroke="#1a1712" stroke-width="1.5" />
    <circle cx="48" cy="81" r="3.8" fill="#9ccb5a" stroke="#1a1712" stroke-width="1.5" />
    <circle cx="22" cy="104" r="4.5" fill="#1a1712" stroke="#3d372c" stroke-width="2.5" />

    <!-- Approval Seal -->
    <circle cx="110" cy="108" r="9.5" fill="#1a1712" stroke="#ffb454" stroke-width="2" />
    <path d="M 106 108 L 109 111 L 114.5 105" stroke="#ffb454" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- MIDDLE: BRAND WORDMARK, TAGLINE & FEATURE PILLS -->
  <text x="184" y="106" font-family="IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="38" font-weight="700" letter-spacing="-0.6">
    <tspan fill="#f0e6d2">Apply</tspan><tspan fill="#ffb454">Diff</tspan>
  </text>
  <rect x="364" y="78" width="10" height="30" rx="2" fill="#ffb454" opacity="0.85" />

  <text x="186" y="134" font-family="IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14.5" font-weight="500" fill="#a99b83">
    git diff for your CV.
  </text>

  <!-- Feature Pills -->
  <g transform="translate(186, 152)" font-family="IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="600">
    <rect x="0" y="0" width="132" height="26" rx="6" fill="#2a1a0e" stroke="#5c3f12" stroke-width="1.2" />
    <circle cx="13" cy="13" r="3.5" fill="#ffb454" />
    <text x="23" y="17" fill="#f0e6d2">CLI &#183; TUI &#183; Web</text>

    <rect x="140" y="0" width="100" height="26" rx="6" fill="#1d2412" stroke="#9ccb5a" stroke-opacity="0.45" stroke-width="1.2" />
    <text x="151" y="17" fill="#9ccb5a">+hunk</text>
    <text x="191" y="17" fill="#a99b83">review</text>
  </g>

  <text x="186" y="200" font-family="IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="11.5" fill="#6f6555">
    Every application is a branch. Every edit is a hunk.
  </text>

  <!-- RIGHT: DIFF TERMINAL PREVIEW CARD -->
  <g transform="translate(456, 22)">
    <rect x="0" y="0" width="424" height="212" rx="12" fill="#1a1712" stroke="#3d372c" stroke-width="1.5" />

    <!-- Top Bar -->
    <path d="M 0 12 A 12 12 0 0 1 12 0 H 412 A 12 12 0 0 1 424 12 V 36 H 0 Z" fill="#221e17" />
    <line x1="0" y1="36" x2="424" y2="36" stroke="#2f2a21" stroke-width="1.2" />

    <!-- Window Dots -->
    <circle cx="16" cy="18" r="4" fill="#e5644e" opacity="0.8" />
    <circle cx="30" cy="18" r="4" fill="#ffb454" opacity="0.8" />
    <circle cx="44" cy="18" r="4" fill="#9ccb5a" opacity="0.8" />

    <!-- Branch Chip -->
    <rect x="62" y="8" width="176" height="20" rx="5" fill="#2a1a0e" stroke="#5c3f12" stroke-width="1" />
    <circle cx="73" cy="18" r="3" fill="#ffb454" />
    <text x="82" y="22" font-family="IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" font-weight="600" fill="#ffb454">
      branch: honor/sr-backend
    </text>

    <text x="312" y="22" font-family="IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" fill="#6f6555">
      @@ exp.gofood @@
    </text>

    <!-- Diff Content Area -->
    <g font-family="IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11">
      <text x="16" y="58" fill="#6f6555">14</text>
      <text x="40" y="58" fill="#a99b83">Senior Software Engineer &#183; GoTo Group</text>

      <!-- Deleted Hunk Row (-) -->
      <rect x="10" y="68" width="404" height="32" rx="6" fill="#2a1712" stroke="#e5644e" stroke-opacity="0.4" stroke-width="1" />
      <rect x="10" y="72" width="3" height="24" rx="1.5" fill="#e5644e" />
      <text x="20" y="88" fill="#e5644e" font-weight="700">-</text>
      <text x="36" y="88" fill="#e5644e" opacity="0.9" text-decoration="line-through">Built backend microservices and APIs for merchants</text>

      <!-- Added Hunk Row (+) -->
      <rect x="10" y="106" width="404" height="46" rx="6" fill="#1d2412" stroke="#9ccb5a" stroke-opacity="0.7" stroke-width="1.2" />
      <rect x="10" y="110" width="3" height="38" rx="1.5" fill="#9ccb5a" />
      <text x="20" y="125" fill="#9ccb5a" font-weight="700">+</text>
      <text x="36" y="125" fill="#f0e6d2">Architected <tspan fill="#9ccb5a" font-weight="600">Go &amp; Kafka</tspan> services; cut rollout <tspan fill="#9ccb5a" font-weight="600">-40%</tspan></text>

      <!-- Inline Approval Controls -->
      <rect x="36" y="132" width="68" height="15" rx="3.5" fill="#2a1a0e" stroke="#5c3f12" stroke-width="0.8" />
      <text x="43" y="142.5" font-size="9" font-weight="600" fill="#ffb454">ATS match</text>

      <rect x="110" y="132" width="84" height="15" rx="3.5" fill="#1d2412" stroke="#9ccb5a" stroke-opacity="0.6" stroke-width="0.8" />
      <text x="118" y="142.5" font-size="9" font-weight="600" fill="#9ccb5a">&#10003; Accepted</text>

      <text x="16" y="170" fill="#6f6555">16</text>
      <text x="40" y="170" fill="#6f6555">Held 99.9%+ uptime across 6+ production services</text>
    </g>

    <!-- Bottom Pipeline Status Bar -->
    <line x1="0" y1="180" x2="424" y2="180" stroke="#2f2a21" stroke-width="1.2" />
    <g font-family="IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" font-weight="600">
      <circle cx="18" cy="196" r="3.5" fill="#9ccb5a" />
      <text x="27" y="200" fill="#a99b83">scan</text>
      <text x="58" y="200" fill="#6f6555">&#8594;</text>
      <text x="72" y="200" fill="#a99b83">diff</text>
      <text x="101" y="200" fill="#6f6555">&#8594;</text>
      <text x="115" y="200" fill="#9ccb5a">approve</text>
      <text x="168" y="200" fill="#6f6555">&#8594;</text>
      <rect x="182" y="186" width="230" height="20" rx="4" fill="#2a1a0e" stroke="#5c3f12" stroke-width="1" />
      <text x="191" y="199.5" fill="#ffb454" font-size="10">output/2026-10-17-honor-sr.pdf</text>
    </g>
  </g>
</svg>
```
