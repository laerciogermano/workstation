# Text & Typography Effects

## 1. Text Split Reveal
Animate individual characters, words, or lines into view.

- **Trigger**: Scroll reveal, page load, or hover.
- **Stack Choice**: `motion/react` for simple staggers; GSAP + SplitText for complex multi-line choreography.
- **Default Params**: 
  - `y: 20` to `0`
  - `opacity: 0` to `1`
  - `stagger: 0.02s` (chars) or `0.05s` (words)
  - `ease: "power3.out"` or `spring(stiffness: 100, damping: 20)`
- **Performance Caveats**: Splitting text into many `<span>` elements can increase DOM nodes significantly. Avoid on very long paragraphs.
- **Fallback Strategy**: Fade in the entire block if JS is disabled or on Tier 3 devices.
- **Use When**: Headlines, hero sections, premium landing pages.
- **Avoid When**: Body text, frequently updating content, low-end mobile devices.

## 2. Variable Font Motion
Smoothly transition font weight, width, or other axes.

- **Trigger**: Hover, scroll position, or interaction state.
- **Stack Choice**: CSS Transitions (for simple axes) or `motion/react` (for physics-based axis interpolation).
- **Default Params**: 
  - `font-weight: 400` to `700`
  - `font-stretch: 100%` to `125%`
  - `duration: 0.4s`
  - `ease: "easeInOut"`
- **Performance Caveats**: Animating font axes can be CPU intensive on some browsers. Ensure the font file is optimized (WOFF2).
- **Fallback Strategy**: Snap between standard weights (400/700) on Tier 3 devices.
- **Use When**: Interactive branding, hover states on navigation, scroll-driven emphasis.
- **Avoid When**: Using non-variable fonts (simulated bolding is ugly), high-latency connections (large font files).

---
**Cross-links**:
- [Performance Guardrails](performance-guardrails.md)
- [Device Tiering](device-tiering.md)
- [QA Checklist](qa-checklist.md)
