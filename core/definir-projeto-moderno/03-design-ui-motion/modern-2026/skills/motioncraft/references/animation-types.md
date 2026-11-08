# Animation Types

Use this file when the user asks for a concrete effect type or when a vague request must be classified before implementation.

For each request, also assign an orchestration level before choosing the stack:

- single-element: one button, card, icon, or highlight
- multi-element staged: several related elements with stagger or coordination
- timeline: one controlled sequence with multiple beats
- scroll-scrubbed: progress maps continuously to scroll
- pinned narrative: a section stays pinned while the sequence unfolds

## Hover and Micro-Interaction

- `hover scale`: small scale increase, often paired with tiny lift
- `hover lift`: upward translate with optional shadow, glow, or background shift
- `underline slide`: width or transform-based underline reveal
- `icon rotate`: small icon rotation or nudge for directional feedback
- `glow hover`: localized highlight, often layered under text or card edges
- `gradient hover`: gradient position or opacity shift, usually subtle
- `glass hover`: backdrop, border, or highlight movement rather than strong geometry change

Use CSS first unless the interaction needs spring feel, orchestration, or shared state.

## Cursor and Pointer Interaction

- `cursor follow`: a child element trails the pointer with smoothing
- `custom cursor`: global or scoped cursor replacement with position interpolation
- `cursor spotlight`: radial highlight tracks pointer inside a region
- `magnetic button`: pointer offset pulls the control inside bounded translate limits
- `mouse trail`: particles or repeated elements follow pointer history
- `hover-based mouse glow`: local glow intensity and position respond to pointer movement

These effects need local coordinate mapping. Avoid frequent state churn.

## Card and Layout Interaction

- `3d tilt card`: rotate on X and Y from pointer position
- `flip card`: front/back reveal around a stable 3D axis
- `card expand`: closed card grows into detail panel
- `accordion-like reveal`: stacked disclosure with smooth height or layout change
- `layout transition`: movement caused by reflow or layout change
- `shared element transition`: one visual element appears to morph or travel between contexts

For expand and shared layout, preserve content legibility during the transition.

## Physics and Feedback

- `spring animation`: spring-led movement or return
- `damping animation`: controlled return with reduced bounce
- `elastic feedback`: overshoot and settle
- `drag inertia`: post-drag momentum and bounds
- `press feedback`: compact push-in effect on tap or click
- `bounce return`: stronger rebound after release or constraint hit

Choose these when the user asks for tactile, elastic, natural, or damped behavior.

## Scroll and Storytelling

- `scroll reveal`: elements enter from hidden states when reaching a viewport threshold
- `parallax`: layers move at different rates across scroll distance
- `sticky section animation`: a section pins while content transforms or swaps
- `timeline-based scroll animation`: scroll progress drives a sequence of staged changes
- `section transition`: one section hands off to the next with choreographed timing
- `scroll-driven opacity or transform`: direct progress mapping for fade, move, scale, or rotate

Use GSAP and ScrollTrigger when the sequence is scroll-scrubbed, pinned, or heavily choreographed. Use IntersectionObserver plus CSS or small JS for simple non-scrub reveals.

## Visual Enhancement

- `glow effect`: controlled light accent around content or edges
- `gradient flow`: slow gradient drift or directional lighting motion
- `blob animation`: organic morphing shape movement
- `morphing shape`: one path or blob changes contour over time
- `glassmorphism motion`: layered sheen, glare, blur, and border response
- `liquid-like hover`: soft deformation or highlight behavior under pointer
- `shader-like visual motion`: advanced visual field, often not needed for simple UI requests

Only escalate to Canvas, WebGL, or shaders when ordinary DOM motion cannot achieve the requested look.

## Page and Scene Transition

- `page transition`: full page enter and exit motion
- `route transition`: app route-level transitions with framework awareness
- `modal open or close`: layered entry, backdrop timing, and focus-safe exit
- `shared layout transition`: continuity between source and destination element

Keep these transitions subordinate to content clarity.
