# Advanced Visual Effects

## 1. Contextual Micro Physics
Elements that react to each other or the environment using basic physics (gravity, collision, attraction).

- **Trigger**: Drag, hover, or collision.
- **Stack Choice**: `motion/react` (for simple drag/spring); Matter.js or P2.js (for complex collisions).
- **Default Params**: 
  - `drag: true`
  - `dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 }`
  - `dragElastic: 0.5`
- **Performance Caveats**: Physics engines are CPU intensive. Limit the number of active bodies.
- **Escalation Criteria**: Only use if the interaction is core to the experience. Escalates to Tier 1 devices only.
- **Fallback Strategy**: Disable physics and use standard draggable elements or static layout on Tier 2/3.
- **Use When**: Playful UI elements, interactive "bouncy" cards, experimental navigation.
- **Avoid When**: Precision is required (e.g., forms, critical navigation).

## 2. Shader Gradient / Aurora
Animated, flowing background gradients using WebGL shaders.

- **Trigger**: Ambient / Auto-playing.
- **Stack Choice**: Three.js (ShaderMaterial) or vanilla WebGL.
- **Default Params**: 
  - `time` uniform for animation.
  - `resolution` uniform for scaling.
- **Performance Caveats**: High GPU usage. Can drain battery quickly on mobile.
- **Escalation Criteria**: Escalates to Tier 1/2 devices. Tier 3 must use static fallbacks.
- **Fallback Strategy**: Static CSS gradient or a simple CSS-animated gradient on Tier 2/3.
- **Use When**: Hero backgrounds, premium branding, ambient site atmosphere.
- **Avoid When**: Performance is the top priority (e.g., utility apps).

## 3. Metaball Gooey
A "liquid" effect where elements appear to merge when they get close.

- **Trigger**: Proximity / Movement.
- **Stack Choice**: CSS Filters (`blur` + `contrast`) or SVG Filters (`feGaussianBlur` + `feColorMatrix`).
- **Default Params**: 
  - `filter: blur(10px) contrast(20)`
- **Performance Caveats**: CSS filters can be very heavy on the compositor. Avoid on large areas.
- **Escalation Criteria**: Escalates to Tier 1 devices for large areas; Tier 2 for small icons.
- **Fallback Strategy**: Remove the filter and show standard separate elements on Tier 2/3.
- **Use When**: Creative loaders, organic menu transitions, playful buttons.
- **Avoid When**: Sharpness and clarity are required.

## 4. Particle Field Interaction
A field of particles that react to the cursor (attraction/repulsion).

- **Trigger**: `mousemove` / `pointermove`.
- **Stack Choice**: HTML5 Canvas or WebGL (for thousands of particles).
- **Default Params**: 
  - `particleCount: 100-500` (Canvas) or `5000+` (WebGL).
  - `interactionRadius: 150px`.
- **Performance Caveats**: Canvas drawing is CPU-bound; WebGL is GPU-bound. Tier 3 devices should disable this.
- **Escalation Criteria**: Escalates to Tier 1 (WebGL) or Tier 2 (Canvas).
- **Fallback Strategy**: Static background or no particles on Tier 2/3.
- **Use When**: Immersive landing pages, tech-themed sites.
- **Avoid When**: Overwhelming the user or obscuring content.

## 5. Depth Camera Parallax
Multi-layered parallax that reacts to device orientation or cursor, creating a "window" effect.

- **Trigger**: `deviceorientation` (Mobile) or `mousemove` (Desktop).
- **Stack Choice**: Vanilla JS + CSS Transforms.
- **Default Params**: 
  - `depthFactor: 0.05`
  - `layers: 3-5`
- **Performance Caveats**: Frequent updates. Use `requestAnimationFrame`.
- **Escalation Criteria**: Escalates to Tier 1/2 devices.
- **Fallback Strategy**: Static stack or simple single-layer parallax on Tier 3.
- **Use When**: Hero sections, immersive storytelling, mobile-first creative sites.
- **Avoid When**: Users prone to motion sickness (provide a toggle).

---
**Cross-links**:
- [Performance Guardrails](performance-guardrails.md)
- [Device Tiering](device-tiering.md)
- [QA Checklist](qa-checklist.md)
