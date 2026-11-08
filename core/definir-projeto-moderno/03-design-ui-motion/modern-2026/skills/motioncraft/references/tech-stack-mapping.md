# Tech Stack Mapping

Use this file when choosing the implementation stack.

When outputting code, always bind the recommendation to a concrete package name, install command, and expected integration boundary.

## Selection Priorities

1. Match the stack to the effect type
2. Match the stack to the existing framework
3. Keep the dependency footprint as light as the effect allows
4. Prefer libraries that simplify cleanup, layout motion, and gesture handling when those are core to the request

## React

### Prefer Motion for React when

- the effect is hover, tap, reveal, spring, drag, reorder, or layout transition
- the request needs variants, gestures, or layout animation with clear component boundaries
- the user wants fast implementation in a React UI layer

Useful directions:
- the modern official package direction is `motion` with React imports from `motion/react`
- when outputting code, show the install command for `motion`
- `whileHover`, `whileTap`, and gesture props for micro-interactions
- `layout`, `layoutId`, and `LayoutGroup` for layout and shared-element transitions
- spring transitions for tactile UI behavior

### Prefer GSAP when

- the effect is timeline-heavy or sequencing-heavy
- the animation spans many elements with precise choreography
- the effect is scroll-led, pinned, or scrubbed

Useful directions:
- timelines for orchestration
- ScrollTrigger for reveal, pinning, scrub, and section storytelling
- `start`, `end`, `scrub`, `pin`, and `snap` as the main control surface
- explicit cleanup in component lifecycle
- one parent timeline for one coordinated scroll sequence when possible

### Prefer CSS or CSS plus small JS when

- the effect is a simple hover, press, glow, underline, gradient shift, or basic reveal
- the interaction does not need gesture state machines or complex orchestration

## Next.js

- Treat browser-driven animation as client-side behavior
- Use client components for Motion or GSAP integrations that touch browser APIs
- For Motion in App Router, client boundaries matter; mention them when implementation depends on browser APIs
- For GSAP in React or Next.js, use a cleanup-safe integration pattern and scope selectors carefully
- For GSAP React integration, prefer `useGSAP` with `scope` and `contextSafe()` when event handlers create animations after initial mount
- Avoid pushing heavy scroll orchestration into server-rendered assumptions

## Vanilla JS

- Use CSS transitions and keyframes for simple state changes
- Use `requestAnimationFrame` for tilt, magnetic, spotlight, or smooth follow behavior
- Keep transforms bounded and easy to tune

## Vue

- Respect the existing Vue component structure
- Use a Vue-friendly motion approach when one is already present
- Otherwise provide a clean component plus direct DOM math for pointer-driven effects

## Escalate Beyond DOM Only When Necessary

- Mention Canvas for particle fields or heavy visual surfaces
- Mention WebGL or Three.js for real 3D scenes, volumetric visuals, or shader-driven effects
- Do not propose advanced rendering stacks for ordinary cards, buttons, hover states, or scroll reveal

## Performance Notes

- prefer `transform` and `opacity`
- keep pointer math out of frequent React state updates
- define scroll trigger ranges clearly
- if `start` or `end` depend on layout, prefer function-based values and refresh-safe setup
- do not animate the pinned element itself; animate its children
- avoid nesting many ScrollTriggers inside one parent timeline-controlled sequence
- avoid mixing CSS transitions on properties controlled by GSAP
- clean up observers, listeners, animation instances, and frame loops
- consider reduced-motion fallbacks for substantial effects
