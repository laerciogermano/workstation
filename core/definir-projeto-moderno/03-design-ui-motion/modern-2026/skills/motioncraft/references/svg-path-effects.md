# SVG Path Effects

## 1. SVG Path Morph
Smoothly transition between two different SVG shapes.

- **Trigger**: State change, hover, or scroll.
- **Stack Choice**: `motion/react` (built-in path morphing) or GSAP MorphSVG (for complex/uneven point counts).
- **Default Params**: 
  - `duration: 0.5s`
  - `ease: "anticipate"` or `spring`
- **Performance Caveats**: Ensure both paths have a similar number of points for the smoothest transition. Complex paths with thousands of points will lag.
- **Fallback Strategy**: Simple fade between two static SVGs on Tier 3 devices.
- **Use When**: Icon transitions (play to pause), organic background shapes, interactive illustrations.
- **Avoid When**: Paths are extremely complex, cross-browser consistency is critical without a heavy library.

---
**Cross-links**:
- [Performance Guardrails](performance-guardrails.md)
- [Device Tiering](device-tiering.md)
- [QA Checklist](qa-checklist.md)
