# Landing Page Motion Streams

When building a landing page, prioritize one of these four implementation schools. Each stream has a specific technical focus and recommended stack.

## 1. Framer-style DOM Motion Stream
Focuses on high-quality UI transitions, layout animations, and micro-interactions using standard DOM elements.

- **Best for**: SaaS landing pages, product feature showcases, clean and modern interfaces.
- **Core Stack**: `motion/react` (formerly `framer-motion`).
- **Key Patterns**:
  - `AnimatePresence` for entry/exit.
  - `layout` and `layoutId` for shared element transitions.
  - `whileInView` for simple scroll reveals.
- **Feel**: Silky, responsive, and integrated.

## 2. Scroll Storytelling Stream
Focuses on immersive, scroll-driven narratives where the user's scroll position controls the animation progress.

- **Best for**: Brand storytelling, complex product explainers, cinematic experiences.
- **Core Stack**: `GSAP` + `ScrollTrigger` + `Lenis` (for smooth scroll).
- **Key Patterns**:
  - `ScrollTrigger.create()` for pinning and scrubbing.
  - `gsap.timeline()` for orchestrated sequences.
  - `ScrollTrigger.refresh()` after dynamic layout changes or image loads.
- **Feel**: Controlled, cinematic, and deliberate.

## 3. Hybrid DOM + Canvas 3D Stream
Integrates 3D elements into the web page, often using a background or interactive 3D hero section.

- **Best for**: High-tech products, creative portfolios, futuristic brand identities.
- **Core Stack**: `@react-three/fiber` + `@react-three/drei` + `Three.js`.
- **Key Patterns**:
  - `useFrame` for per-frame animation loops (avoid React state here).
  - `Float`, `PresentationControls` for interactive models.
  - Canvas as a background or fixed element behind DOM content.
- **Feel**: Immersive, high-end, and interactive.

## 4. Router-level Transition Stream
Focuses on seamless transitions between different pages or sections using modern routing libraries.

- **Best for**: Multi-page marketing sites, web apps with a strong brand identity using TanStack Router or React Router.
- **Core Stack**: `React` + `motion/react` + `TanStack Router` / `React Router`.
- **Key Patterns**:
  - Router-level transition hooks and components.
  - Keyed routes within `AnimatePresence`.
  - Shared layout components that persist across transitions.
- **Feel**: Fluid, app-like, and cohesive.
