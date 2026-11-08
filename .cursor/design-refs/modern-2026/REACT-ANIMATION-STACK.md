# Stack de animação React (2026)

## Decisão em 30 segundos

1. Hover / focus / open-close simples → **CSS** (`transition`, `@starting-style`, `allow-discrete`)
2. Lista reorder / drag / spring / exit coordenado → **Motion** (`motion/react`)
3. Navegação rota A→B com elemento compartilhado → **View Transitions**
4. Scroll pin + scrub / SplitText / timeline longa → **GSAP**
5. Um produto 3D no herói → **R3F / Spline** (lazy)

## Motion (ex-Framer Motion)

```tsx
import { motion, AnimatePresence } from "motion/react";

<motion.li
  layout
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

Donos: `layout` / `layoutId`, gestures, `AnimatePresence`, springs interruptíveis.

## CSS moderno

```css
.popover {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms, transform 200ms, display, overlay;
  transition-behavior: allow-discrete;
}
@starting-style {
  .popover { opacity: 0; transform: translateY(4px); }
}

.reveal {
  animation: fade-up linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}
```

## View Transitions

- Nomear com `view-transition-name`
- Em React/Next: wrappers de transição de rota
- Não misturar `AnimatePresence` no mesmo elemento shared
- Reduced motion: zerar duração de `::view-transition-*` ou só manter crossfade

## GSAP

- Landing / marketing / storytelling
- `ScrollTrigger` pin+scrub, SplitText, DrawSVG, MotionPath
- Produto SaaS denso: usar com parcimônia (ou só na home)

## Performance

- Preferir `transform` + `opacity`
- Evitar animar `width` / `height` / `top` / `left`
- Lazy-load GSAP/R3F
- Medir INP em device médio

## Fontes deste doc

- https://themotiondesign.com/writing/motion-for-react-view-transitions
- https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion
- https://motion.dev/docs/performance
- https://www.syncfusion.com/blogs/post/motion-vs-gsap-react
