# Accessibility Fallback Matrix

Motion must be inclusive. Users with vestibular disorders or performance constraints require graceful degradation.

## Reduced Motion Strategy

Always wrap significant motion in a `prefers-reduced-motion` check.

### CSS Pattern
```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none !important;
    transition: none !important;
  }
}
```

### React Pattern (Motion React)
```tsx
import { useReducedMotion } from "motion/react";

function Component() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={shouldReduceMotion ? { opacity: 1 } : { x: 100 }}
    />
  );
}
```

## Fallback Matrix

| High Motion Effect | Reduced Motion Fallback | Rationale |
| :--- | :--- | :--- |
| Parallax Scroll | Static Layout | Prevents dizziness/nausea |
| Scale/Zoom | Opacity Fade | Maintains focus without spatial shift |
| 3D Tilt/Rotate | Subtle Highlight | Removes depth-induced strain |
| Layout Morph (FLIP) | Instant Swap | Avoids complex path tracking |
| Staggered List | Simultaneous Fade | Reduces visual noise |

## Focus Management
- **Don't Hide Focus**: Ensure focus rings are never animated out of visibility.
- **Transition Completion**: If moving focus to a new element (e.g., modal), wait for the transition to finish before calling `.focus()`.
- **Aria-Live**: Use `aria-live` for status updates that happen via motion (e.g., "Item added to cart").

## Testing Checklist
- [ ] Toggle "Reduce Motion" in OS settings and verify fallback.
- [ ] Ensure no flashing content (> 3 flashes per second).
- [ ] Verify keyboard navigation remains functional during transitions.
