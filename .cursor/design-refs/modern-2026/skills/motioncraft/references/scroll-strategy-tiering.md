# Scroll Strategy Tiering

Not all scroll animations are equal. Choose the right tier based on complexity and performance needs.

## Tier 1: Simple Reveals (IntersectionObserver)
Best for "fade-in on scroll" or "slide-up" effects.
- **Tool**: `IntersectionObserver` or `whileInView` in Motion React.
- **Pros**: Extremely lightweight, no scroll listeners.
- **Cons**: No "scrubbing" (animation progress tied to scroll position).

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
/>
```

## Tier 2: Scrub & Parallax (CSS or Light JS)
Best for progress bars, parallax backgrounds, or simple scroll-linked transforms.
- **Tool**: CSS Scroll-driven animations (`animation-timeline`) or `useScroll` in Motion React.
- **Pros**: Performant (CSS runs on compositor).
- **Cons**: Limited browser support for CSS (requires progressive enhancement).

### CSS Progressive Enhancement
```css
@supports (animation-timeline: scroll()) {
  .progress-bar {
    animation: grow-progress auto linear;
    animation-timeline: scroll(root);
  }
}
```

## Tier 3: Complex Pinning & Storytelling (GSAP)
Best for "scrollytelling," complex timelines, and pinning elements in place.
- **Tool**: GSAP ScrollTrigger.
- **Pros**: Total control, robust pinning, cross-browser consistency.
- **Cons**: Larger bundle size, requires careful cleanup.

### GSAP Pinning Caveat
**Never animate the pinned element itself.** Animate a child element inside the pinned container to avoid layout calculation loops.

```javascript
gsap.to(".child", {
  scrollTrigger: {
    trigger: ".parent",
    pin: true,
    scrub: true
  },
  x: 500
});
```

## Selection Guide
- **Use Tier 1** for 90% of UI reveals.
- **Use Tier 2** for simple visual flourishes (parallax).
- **Use Tier 3** only for high-impact marketing pages or complex data stories.
