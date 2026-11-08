# Device Tiering Strategy

Deliver the best possible experience based on the user's hardware capabilities.

## Tier 1: High-End (Desktop / Latest Mobile)
- **Capabilities**: High refresh rate (120Hz+), powerful GPU.
- **Motion Strategy**: 
  - Full physics-based springs.
  - Complex layout morphing (FLIP).
  - Real-time blurs and glassmorphism.
  - High-fidelity scroll scrubbing.

## Tier 2: Mid-Range (Older Desktop / Standard Mobile)
- **Capabilities**: 60Hz, moderate GPU.
- **Motion Strategy**:
  - Simplified springs or eased transitions.
  - Limited layout morphing.
  - Static backgrounds (no blurs).
  - Basic scroll reveals (no heavy scrubbing).

## Tier 3: Low-End / Battery Saver (Budget Devices / Low Battery)
- **Capabilities**: Low CPU/GPU, power constraints.
- **Motion Strategy**:
  - CSS transitions only.
  - No physics-based math.
  - Opacity fades only (no transforms if possible).
  - Static layout (no scroll-driven motion).

## Implementation Pattern

### Detection
```javascript
function getDeviceTier() {
  // Simple heuristic: check for hardware concurrency or memory
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  
  if (cores >= 8 && memory >= 8) return 'tier-1';
  if (cores >= 4) return 'tier-2';
  return 'tier-3';
}
```

### Usage
```tsx
const tier = useDeviceTier();

return (
  <motion.div
    animate={tier === 'tier-1' ? { x: 100, scale: 1.1 } : { opacity: 1 }}
  />
);
```

## Battery Status API
Consider downgrading to Tier 3 if `navigator.getBattery()` indicates low power or "Power Saving Mode".
