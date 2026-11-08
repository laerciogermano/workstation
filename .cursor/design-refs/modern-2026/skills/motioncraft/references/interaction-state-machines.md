# Interaction State Machines

Motion should reflect the underlying state of the application. Using a state-machine approach prevents "impossible" animations and ensures logical transitions.

## Core States

| State | Motion Characteristic |
| :--- | :--- |
| `idle` | Static, subtle ambient motion if any |
| `hover` | Anticipatory, slight scale/lift |
| `active` (Press) | Compressed, high stiffness |
| `loading` | Cyclic, rhythmic, indeterminate |
| `success` | Expansive, celebratory, green accents |
| `error` | Shaking, abrupt, red accents |

## Transition Logic

### 1. Interruptibility
Animations must be interruptible. If a user hovers off an element mid-animation, it should smoothly transition back to `idle` from its current position, not jump.

### 2. State Mapping (React Pattern)
```tsx
const variants = {
  idle: { scale: 1, backgroundColor: "#eee" },
  hover: { scale: 1.05, backgroundColor: "#fff" },
  loading: { rotate: 360, transition: { repeat: Infinity, duration: 1 } }
};

<motion.div
  variants={variants}
  animate={currentState} // 'idle' | 'hover' | 'loading'
/>
```

### 3. Feedback Loops
- **Action -> Reaction**: Every user action must have an immediate motion response (even if it's just a 50ms scale down).
- **Confirmation**: Use motion to confirm completion (e.g., a button morphing into a checkmark).

## Anti-Patterns
- **Overlapping States**: Animating to `success` while still in `loading` without a transition.
- **Zombie Animations**: Animations that keep running after the state has changed (e.g., a spinner that doesn't stop immediately).
