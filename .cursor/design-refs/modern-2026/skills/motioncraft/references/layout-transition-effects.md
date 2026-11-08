# Layout & Transition Effects

## 1. Auto-Layout Morph (Shared Element / FLIP)
Animate elements as they move between different layout positions or parents.

- **Trigger**: State change (e.g., expanding a card, moving an item between lists).
- **Stack Choice**: `motion/react` with `layoutId` (easiest); GSAP Flip plugin for complex non-React projects.
- **Default Params**: 
  - `layout: true`
  - `transition: { type: "spring", stiffness: 300, damping: 30 }`
- **Performance Caveats**: Animating layout can cause reflows if not using FLIP (transform-based). `motion/react` handles this automatically.
- **Fallback Strategy**: Instant jump or simple fade on Tier 3 devices.
- **Use When**: Expanding cards, image galleries, filtering/sorting lists.
- **Avoid When**: Animating hundreds of elements simultaneously.

## 2. Route Transition Choreography
Coordinated entry/exit animations when navigating between pages.

- **Trigger**: Navigation / Route change.
- **Stack Choice**: `AnimatePresence` (React), View Transitions API (Native).
- **Default Params**: 
  - `initial: { opacity: 0, x: 20 }`
  - `animate: { opacity: 1, x: 0 }`
  - `exit: { opacity: 0, x: -20 }`
  - `staggerChildren: 0.1`
- **Performance Caveats**: Ensure the "old" page is unmounted correctly to free up memory.
- **Fallback Strategy**: Standard browser navigation (no transition) if `document.startViewTransition` is missing and no JS framework is used.
- **Use When**: SPAs, high-end marketing sites, dashboard navigation.
- **Avoid When**: Multi-page apps (MPA) without View Transitions API support.

---
**Cross-links**:
- [Transition Patterns](transition-patterns.md)
- [Performance Guardrails](performance-guardrails.md)
- [Device Tiering](device-tiering.md)
- [QA Checklist](qa-checklist.md)
