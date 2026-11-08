---
name: frontend-motion-design-codegen
description: analyze explicit frontend motion requests, translate style words into motion decisions, choose the right web animation stack, and generate production-leaning code. use when users explicitly ask for hover effects, cursor interactions, tilt cards, spring feedback, scroll reveal, parallax, sticky storytelling, visual effects, page transitions, or brand-inspired motion such as apple, stripe, linear, or vercel.
---

# Frontend Motion Design Codegen

Build frontend motion in two phases: design the motion system first, then implement it.

Do not jump straight to code. Infer the experience goal, break the motion into parts, choose the lightest stack that fits, and only then output complete code.

## Operating Rules

- Treat words like `premium`, `smooth`, `apple style`, `high-end`, `tech`, `silky`, and `with texture` as motion-direction signals, not just visual adjectives.
- If the user is vague, make explicit working assumptions instead of stopping. State the assumptions in `# Assumptions` and continue. **EXCEPTION**: For landing-page requests, you MUST proceed with the explicitly provided stream (number or name) or ask the user to choose from the four prioritized streams (1-4) before implementation. Do NOT assume a stream.
- Use a safe default ladder when intent is unclear: prioritize usability and clarity over flourish, choose the lightest motion category that satisfies the trigger, and keep amplitude and duration restrained unless the user asks for something theatrical.
- Prefer production-leaning code over conceptual snippets. Output a full component or a full runnable block whenever possible.
- Prefer `transform` and `opacity`. Avoid layout-heavy animation unless the effect truly depends on layout.
- For pointer-driven motion, avoid noisy high-frequency state updates. Prefer refs, CSS variables, direct transforms, and `requestAnimationFrame`.
- For scroll motion, define trigger range, start state, end state, scrub behavior, and cleanup strategy.
- Keep abstractions useful but shallow. Do not bury the core animation logic behind unnecessary helper layers.
- Consider motion and typography together for premium frontend asks. High-end motion requires high-end typography to feel cohesive.

## Input Handling

Support both input styles:

1. Natural language input
   - Example: "Create an Apple-style hover card"
   - Example: "Create a card that follows the cursor"
   - Example: "Create a button with a springy press effect"

2. Structured input
   - Motion type
   - Framework or runtime
   - Animation library preference
   - Style reference
   - Target platform
   - Shipping requirement or production readiness

If structured fields are missing, infer them from context and say so.

## Workflow Decision Tree

Follow this workflow in order:

1. Identify motion category
   - Match the request to one or more categories from [references/animation-types.md](references/animation-types.md).
   - If the request mixes categories, name the primary category first and supporting categories second.

2. Landing Page Stream Selection (Mandatory for Landing Pages)
   - If the request is for a landing page, prioritize the four streams defined in [references/landing-page-streams.md](references/landing-page-streams.md).
   - **Fast Path**: If the prompt already contains a clear stream selection (e.g., "stream 1", "流派 2", or explicit stream name), proceed directly with that stream.
   - Otherwise, you MUST present these options to the user and wait for a numbered selection (1-4) before proceeding to code generation.
   - Use the following prompt block to ask the user:
     ```markdown
     请从以下四种落地页动效流派中选择一种（输入数字 1-4）：
     1. Framer 风格 DOM 动效流 (motion/react) - 适用于 SaaS、产品展示，追求丝滑 UI 交互。
     2. 滚动叙事流 (GSAP + ScrollTrigger + Lenis) - 适用于品牌故事、沉浸式滚动体验。
     3. 混合 DOM + Canvas 3D 流 (React Three Fiber) - 适用于高科技、创意设计，集成 3D 元素。
     4. 路由级过渡流 (TanStack Router / React Router) - 适用于多页面营销站，追求无缝页面切换。
     ```

   - **Reference Loading Map**: Once a stream is selected, read the corresponding reference files:
     - **Stream 1**: `tech-stack-mapping.md`, `font-library.md`
     - **Stream 2**: `scroll-storytelling-effects.md`, `scroll-strategy-tiering.md`, `tech-stack-mapping.md`
     - **Stream 3**: `visual-reveal-effects.md`, `advanced-visual-effects.md`, `device-tiering.md`, `performance-guardrails.md`
     - **Stream 4**: `layout-transition-effects.md`, `transition-patterns.md`, `tech-stack-mapping.md`
     - *Note: All streams must still honor accessibility, performance, and QA references.*

3. Restore the real experience goal
   - Translate style language into motion behavior.
   - Read [references/style-translation.md](references/style-translation.md) when the prompt includes Apple, Stripe, Linear, Vercel, premium, elegant, or futuristic references.
   - Consult [references/font-library.md](references/font-library.md) to select appropriate typography that matches the requested style.

4. Decompose the motion
   - Define trigger, target, states (initial/changed/settled), visual properties, physical feel, and timing.

5. Choose implementation stack
   - Read [references/tech-stack-mapping.md](references/tech-stack-mapping.md) when the framework, runtime, or library choice matters.
   - Choose the lightest stack that can deliver the requested interaction reliably.

6. Recommend parameters
   - Provide concrete starting values for spring, damping, mass, duration, ease, etc.
   - Briefly explain why each group of values fits the requested feel.

7. Output code
   - Prefer a complete component, complete styles, and all required logic.

8. Add optimization guidance
   - Include performance, maintainability, and upgrade suggestions.

## Enterprise Motion Engineering

For production-grade applications, follow these engineering guardrails:

- **Design Tokens**: Use [references/motion-tokens.md](references/motion-tokens.md) to standardize durations, easings, and spring physics.
- **Accessibility**: Consult [references/accessibility-fallback-matrix.md](references/accessibility-fallback-matrix.md) for `prefers-reduced-motion` and focus management.
- **Performance**: Follow [references/performance-guardrails.md](references/performance-guardrails.md) for budgets, hardware acceleration, and anti-patterns.
- **Transitions**: Use [references/transition-patterns.md](references/transition-patterns.md) for FLIP, View Transitions (with fallback), and orchestration.
- **Scroll Strategy**: Tier your scroll effects using [references/scroll-strategy-tiering.md](references/scroll-strategy-tiering.md).
- **State Machines**: Map motion to application states using [references/interaction-state-machines.md](references/interaction-state-machines.md).
- **Device Tiering**: Adapt motion complexity to hardware using [references/device-tiering.md](references/device-tiering.md).
- **QA & Validation**: Use [references/qa-checklist.md](references/qa-checklist.md) for functional, performance, and automated testing.

## Motion Categories

Use these categories for classification. Read [references/animation-types.md](references/animation-types.md) for the full mapping.

- Hover and micro-interaction
- Cursor and pointer interaction
- Card and layout interaction
- Physics and feedback
- Scroll and storytelling
- Visual enhancement
- Page and scene transition

## Cool Effects Catalog

Use these specialized patterns for high-end visual storytelling. Each entry includes implementation guidance, performance caveats, and fallback strategies.

- **Typography**: [Text Split Reveal](references/text-typography-effects.md#1-text-split-reveal), [Variable Font Motion](references/text-typography-effects.md#2-variable-font-motion)
- **Interaction**: [Spotlight Cursor v2](references/cursor-pointer-effects.md#1-spotlight-cursor-v2), [SVG Path Morph](references/svg-path-effects.md#1-svg-path-morph)
- **Transitions**: [Auto-Layout Morph (FLIP)](references/layout-transition-effects.md#1-auto-layout-morph-shared-element--flip), [Route Transition Choreography](references/layout-transition-effects.md#2-route-transition-choreography)
- **Scroll**: [Scroll Story Pin Sequence](references/scroll-storytelling-effects.md#1-scroll-story-pin-sequence), [Video Scrub Transition](references/scroll-storytelling-effects.md#2-video-scrub-transition)
- **Reveal**: [3D Perspective Stack](references/visual-reveal-effects.md#1-3d-perspective-stack), [Masked Reveal](references/visual-reveal-effects.md#2-masked-reveal)
- **Advanced**: [Contextual Micro Physics](references/advanced-visual-effects.md#1-contextual-micro-physics), [Shader Gradient](references/advanced-visual-effects.md#2-shader-gradient--aurora), [Metaball Gooey](references/advanced-visual-effects.md#3-metaball-gooey), [Particle Field](references/advanced-visual-effects.md#4-particle-field-interaction), [Depth Camera Parallax](references/advanced-visual-effects.md#5-depth-camera-parallax)

## Style Translation Rules

Do not echo style words back unchanged. Translate them into implementation decisions along axes of rhythm, force, depth, transition style, and visual accent.

Read [references/style-translation.md](references/style-translation.md) for detailed mappings:
- **Apple**: Restrained timing, subtle depth, gentle spring feel, opacity + transform combos.
- **Stripe**: Soft gradients, flowing light, layered cards, ambient background motion.
- **Linear**: Short durations, precise interaction response, sharp hover states, crisp motion.
- **Vercel**: Restrained micro-interactions, simple transitions, modern minimal restraint.

## Stack Selection Rules

Default to the simplest viable toolchain. Read [references/tech-stack-mapping.md](references/tech-stack-mapping.md) for full selection logic.

- **React**: Prefer `motion` (from `motion/react`) for UI motion; use `whileHover`, `layout`, etc. Prefer GSAP for complex timelines or scroll-led sequences.
- **Next.js**: Use client components for browser-API motion; prefer `motion/react` imports.
- **Vanilla JS**: CSS transitions first; `requestAnimationFrame` for pointer-driven math.
- **Vue**: Use framework-native structures or clean DOM math.
- **Escalation**: Only use Canvas/WebGL/Three.js for particle fields or 3D scenes.

## Required Decomposition Checklist

Before writing code, always cover these points:
- trigger method and affected element
- start, active, and end states
- property changes, timing, and rhythm
- spring or easing choice
- performance-sensitive parts

## Parameter Heuristics

Use concrete ranges. Read [references/style-translation.md](references/style-translation.md) for tuning.
- Gentle premium hover: `duration 0.18-0.28s`, `scale 1.01-1.03`, `translateY -2 to -6px`
- Press feedback: `scale 0.96-0.99`, short duration or crisp spring
- 3D tilt card: `rotateX/rotateY` within `6-14deg`, stable perspective
- Magnetic button: limited translate range `6-18px`, eased return

## Code Generation Rules

Include required logic for specific effects. Do not force heavyweight patterns into light asks.
- **Magnetic button**: Pointer mapping, bounded translation, reset behavior.
- **3D tilt card**: Rotation math, perspective handling, reset behavior.
- **Cursor follow**: Interpolation/smoothing, scoped listeners, cleanup.
- **Scroll reveal**: Trigger zones, scrub/non-scrub behavior, observer/listener cleanup.

## Output Contract

Choose the mode based on request complexity.

### Compact Mode (Simple requests)
Use for basic hover, press, or single-element reveals.
1. **Assumptions**: Brief list if any.
2. **Parameters**: Key values (duration, scale, etc.).
3. **Code**: Complete runnable block.

### Full Mode (Complex requests)
Default for multi-element, scroll, or physics-heavy requests.

# Assumptions
- Restate the real UX goal in more professional motion language.
- State any assumptions you made.

# Motion Decomposition
- Trigger method, state changes, visual changes, physical feel, and element relationships.

# Recommended Implementation
- Recommended stack, why it fits, and a reasonable alternative.

# Recommended Parameters
- Suggested values for spring, damping, duration, easing, etc.

# Implementation Code
- Provide complete runnable code (React component, styles, logic).
- Include install commands and cleanup behavior.

# Optional Optimizations
- Performance, visual, and interaction upgrade ideas.

## Code Quality & Performance

- **Quality**: Clear names, simple APIs, explicit cleanup for listeners and animation instances.
- **Performance**: Prefer `transform`/`opacity`. Avoid reflows. Use `requestAnimationFrame` for pointer math.
- **Scroll**: Use IntersectionObserver for simple reveals; ScrollTrigger for scrub/pin.
- **Accessibility**: Mention `prefers-reduced-motion` for substantial effects.

## Response Style

- Be decisive and practical.
- Explain why the approach fits the interaction.
- Do not dump multiple libraries without a recommendation.

## References

- [references/animation-types.md](references/animation-types.md): Motion taxonomy and trigger cues.
- [references/landing-page-streams.md](references/landing-page-streams.md): Prioritized landing page motion streams.
- [references/style-translation.md](references/style-translation.md): Brand-style translation.
- [references/font-library.md](references/font-library.md): Font library and style mapping.
- [references/tech-stack-mapping.md](references/tech-stack-mapping.md): Framework and library selection.
- [references/motion-tokens.md](references/motion-tokens.md): Standardized motion parameters.
- [references/accessibility-fallback-matrix.md](references/accessibility-fallback-matrix.md): Inclusive motion strategies.
- [references/performance-guardrails.md](references/performance-guardrails.md): Performance budgets and safe properties.
- [references/transition-patterns.md](references/transition-patterns.md): FLIP and View Transition patterns.
- [references/scroll-strategy-tiering.md](references/scroll-strategy-tiering.md): Scroll implementation tiers.
- [references/interaction-state-machines.md](references/interaction-state-machines.md): State-driven motion logic.
- [references/device-tiering.md](references/device-tiering.md): Hardware-based motion adaptation.
- [references/qa-checklist.md](references/qa-checklist.md): Validation and testing protocols.
- [references/text-typography-effects.md](references/text-typography-effects.md): Text and variable font effects.
- [references/cursor-pointer-effects.md](references/cursor-pointer-effects.md): Pointer and spotlight effects.
- [references/svg-path-effects.md](references/svg-path-effects.md): SVG morphing and path effects.
- [references/layout-transition-effects.md](references/layout-transition-effects.md): Layout and route transitions.
- [references/scroll-storytelling-effects.md](references/scroll-storytelling-effects.md): Scroll pinning and video scrubbing.
- [references/visual-reveal-effects.md](references/visual-reveal-effects.md): 3D and masking reveals.
- [references/advanced-visual-effects.md](references/advanced-visual-effects.md): Physics, shaders, and particles.
