# Scroll & Storytelling Effects

## 1. Scroll Story Pin Sequence
Pinning an element in place while its internal content or surrounding elements animate based on scroll progress.

- **Trigger**: Scroll position.
- **Stack Choice**: GSAP ScrollTrigger (Industry standard); CSS `sticky` + `animation-timeline` (Modern/Lightweight).
- **Default Params**: 
  - `trigger: ".section"`
  - `start: "top top"`
  - `end: "+=2000"`
  - `pin: true`
  - `scrub: 1`
- **Performance Caveats**: **Do not animate the pinned element itself** (causes jitter). Animate an inner wrapper instead.
- **Fallback Strategy**: Standard vertical scrolling (no pinning) on Tier 3 or mobile devices if the layout becomes cramped.
- **Use When**: Product walkthroughs, long-form editorial content, complex data visualizations.
- **Avoid When**: Mobile devices with small screens where pinning obscures content.

## 2. Video Scrub Transition
Controlling video playback frame-by-frame based on scroll position.

- **Trigger**: Scroll position.
- **Stack Choice**: GSAP ScrollTrigger + `<video>` element.
- **Default Params**: 
  - `scrub: true`
  - `video.currentTime` mapped to scroll progress.
- **Performance Caveats**: Requires highly optimized video (short GOP distance, low bitrate). Can be very heavy on CPU/GPU.
- **Escalation Criteria**: Escalates to Tier 1 devices with high-speed connections.
- **Fallback Strategy**: Replace with a static image or an auto-playing loop on Tier 2/3 devices.
- **Use When**: High-end product landing pages (e.g., Apple style).
- **Avoid When**: Users are on slow connections or low-end hardware.

---
**Cross-links**:
- [Scroll Strategy Tiering](scroll-strategy-tiering.md)
- [Performance Guardrails](performance-guardrails.md)
- [Device Tiering](device-tiering.md)
- [QA Checklist](qa-checklist.md)
