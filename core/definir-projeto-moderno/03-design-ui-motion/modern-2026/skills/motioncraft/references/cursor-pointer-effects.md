# Cursor & Pointer Effects

## 1. Spotlight Cursor v2
A masked "flashlight" effect that follows the cursor, revealing content or adding a glow.

- **Trigger**: `mousemove` / `pointermove`.
- **Stack Choice**: Vanilla JS + CSS Variables for performance; `motion/react` for springy "lag" feel.
- **Default Params**: 
  - `size: 300px`
  - `blur: 100px`
  - `opacity: 0.15`
  - `spring: { stiffness: 150, damping: 30 }`
- **Performance Caveats**: Use `requestAnimationFrame` to update CSS variables. Avoid heavy filters like `backdrop-filter` inside the spotlight on Tier 2/3 devices.
- **Fallback Strategy**: Disable on touch devices (no hover). Use a static subtle glow or remove entirely on Tier 3.
- **Use When**: Dark mode landing pages, feature highlights, interactive portfolios.
- **Avoid When**: Content-heavy pages where the mask obscures readability, mobile-first sites.

---
**Cross-links**:
- [Performance Guardrails](performance-guardrails.md)
- [Device Tiering](device-tiering.md)
- [QA Checklist](qa-checklist.md)
