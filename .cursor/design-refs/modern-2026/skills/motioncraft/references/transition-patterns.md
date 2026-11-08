# Transition Patterns

Modern web applications require fluid transitions between states and pages.

## 1. Shared Element Transitions (FLIP)
FLIP stands for **First, Last, Invert, Play**. It allows you to animate elements between different layout positions.

### Motion React Implementation
Use `layoutId` to automatically handle FLIP.
```tsx
<motion.div layoutId="shared-id" />
```

## 2. View Transition API
The native browser API for smooth transitions between DOM states.

### Implementation with Fallback
```javascript
function transition(updateCallback) {
  if (!document.startViewTransition) {
    updateCallback();
    return;
  }
  
  document.startViewTransition(updateCallback);
}
```

### CSS Customization
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.5s;
}
```

## 3. Orchestration & Staggering
Avoid "pop-in" effects by staggering the entry of multiple elements.

### Stagger Pattern (Motion React)
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}
```

## 4. Exit Animations
Ensure elements animate *out* before being removed from the DOM.

### React Pattern
Use `AnimatePresence` to wrap conditional components.
```tsx
<AnimatePresence>
  {isVisible && (
    <motion.div exit={{ opacity: 0 }} />
  )}
</AnimatePresence>
```

## 5. Page Transitions
- **Cross-fade**: Simplest, safest.
- **Slide/Push**: Good for hierarchical navigation.
- **Shared Hero**: High-end, connects content across pages.
