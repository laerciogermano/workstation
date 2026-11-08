# Motion Tokens

Enterprise-grade motion systems rely on tokens to ensure consistency, maintainability, and brand alignment across platforms.

## Token Categories

### 1. Duration Tokens
Standardized time units for different interaction scales.

| Token | Value | Use Case |
| :--- | :--- | :--- |
| `motion.duration.instant` | 50ms | Immediate feedback, toggle states |
| `motion.duration.fast` | 150ms | Hover effects, micro-interactions |
| `motion.duration.standard` | 300ms | Modal entries, page transitions |
| `motion.duration.slow` | 500ms | Complex reveals, storytelling |

### 2. Easing Tokens
Curated curves for specific physical feels.

| Token | Value (CSS) | Feel |
| :--- | :--- | :--- |
| `motion.easing.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Natural, balanced |
| `motion.easing.decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Incoming elements (Apple-like) |
| `motion.easing.accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Outgoing elements |
| `motion.easing.sharp` | `cubic-bezier(0.4, 0, 0.6, 1)` | Precise, technical (Linear-like) |

### 3. Spring Presets
Physics-based parameters for libraries like Motion React or GSAP.

| Preset | Stiffness | Damping | Mass | Feel |
| :--- | :--- | :--- | :--- | :--- |
| `motion.spring.snappy` | 400 | 30 | 1 | High energy, quick settle |
| `motion.spring.smooth` | 200 | 25 | 1 | Premium, fluid |
| `motion.spring.bouncy` | 500 | 15 | 1 | Playful, elastic |

## Implementation Patterns

### CSS Variables
```css
:root {
  --motion-duration-standard: 300ms;
  --motion-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
}

.card {
  transition: transform var(--motion-duration-standard) var(--motion-easing-standard);
}
```

### JavaScript/TypeScript
```typescript
export const motionTokens = {
  duration: {
    standard: 0.3,
  },
  spring: {
    smooth: { stiffness: 200, damping: 25, mass: 1 },
  }
};
```

## Best Practices
- **Avoid Hardcoding**: Never use raw ms/bezier values in components.
- **Semantic Naming**: Name tokens by their role (`standard`, `emphasized`) rather than their value (`300ms`).
- **Platform Parity**: Ensure tokens are shared between Web, iOS, and Android via tools like Style Dictionary.
