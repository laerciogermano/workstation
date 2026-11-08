# Visual Reveal Effects

## 1. 3D Perspective Stack
Layered elements that tilt or shift in 3D space, creating depth.

- **Trigger**: Hover or pointer movement.
- **Stack Choice**: CSS `transform: rotateX() rotateY()`; `motion/react` for spring-smoothed tilt.
- **Default Params**: 
  - `perspective: 1000px`
  - `rotateX: -10deg` to `10deg`
  - `rotateY: -10deg` to `10deg`
  - `spring: { stiffness: 100, damping: 20 }`
- **Performance Caveats**: Use `transform-style: preserve-3d` on the parent. Keep the number of layers low.
- **Fallback Strategy**: 2D translation (parallax) or static stack on Tier 3.
- **Use When**: Card components, hero images, interactive banners.
- **Avoid When**: Elements contain clickable links that become hard to hit due to rotation.

## 2. Masked Reveal
Using shapes or text as a mask to reveal underlying content (images/video).

- **Trigger**: Scroll, hover, or load.
- **Stack Choice**: CSS `mask-image` or `clip-path`.
- **Default Params**: 
  - `clip-path: circle(0% at 50% 50%)` to `circle(100%)`
  - `duration: 0.8s`
  - `ease: "circOut"`
- **Performance Caveats**: Animating `clip-path` is generally performant (GPU accelerated). Complex SVG masks can be slower.
- **Fallback Strategy**: Simple opacity fade on Tier 3.
- **Use When**: Transitioning between sections, revealing hero images, creative typography.
- **Avoid When**: Browser support for specific mask types is inconsistent (check CanIUse).

---
**Cross-links**:
- [Performance Guardrails](performance-guardrails.md)
- [Device Tiering](device-tiering.md)
- [QA Checklist](qa-checklist.md)
