# Performance Guardrails

High-end motion must not compromise the main thread. Smoothness (60/120fps) is the primary metric of quality.

## Performance Budgets

| Metric | Target | Threshold |
| :--- | :--- | :--- |
| Frame Time | < 16.6ms | < 8.3ms (for 120Hz) |
| Main Thread Blocking | < 50ms | Avoid Long Tasks |
| Composite Thread | 100% | Keep animations on GPU |

## The "Golden Rule" of Properties
Only animate properties that do not trigger **Layout** or **Paint**.

- **Safe (Compositor)**: `transform` (translate, scale, rotate, skew), `opacity`.
- **Unsafe (Layout/Paint)**: `width`, `height`, `top`, `left`, `margin`, `padding`, `border-width`, `box-shadow`.

## Guardrails & Anti-Patterns

### 1. Avoid Layout Thrashing
Do not read layout properties (like `offsetHeight`) inside an animation loop or `requestAnimationFrame` without caching.

### 2. Use `will-change` Sparingly
Only apply `will-change: transform, opacity` to elements that are *about* to animate. Remove it once the animation is done to save GPU memory.

### 3. Hardware Acceleration
Force GPU layers for complex elements using `transform: translateZ(0)` or `backface-visibility: hidden`.

### 4. Debounce Pointer Events
For cursor-following effects, use `requestAnimationFrame` to throttle updates to the screen's refresh rate.

```javascript
let targetX = 0;
function onMouseMove(e) {
  targetX = e.clientX;
}

function update() {
  // Apply smoothing math here
  element.style.transform = `translateX(${currentX}px)`;
  requestAnimationFrame(update);
}
```

### 5. Cleanup
Always kill GSAP timelines or remove event listeners on component unmount to prevent memory leaks.

## Performance Profiling
- Use Chrome DevTools **Performance** tab to check for "Long Tasks".
- Use **Rendering** tab -> **FPS Meter** to monitor frame drops.
- Check **Layer Borders** to ensure animated elements are on their own compositor layers.
