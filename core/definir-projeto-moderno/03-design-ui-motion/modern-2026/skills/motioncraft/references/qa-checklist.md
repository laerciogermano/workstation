# QA Checklist

Enterprise motion requires rigorous validation across functional, performance, and accessibility axes.

## 1. Functional Validation
- [ ] **Trigger Accuracy**: Does the animation trigger exactly when expected (hover, click, scroll)?
- [ ] **State Completion**: Does the element reach the intended final state?
- [ ] **Interruptibility**: Does the animation handle mid-flight reversals gracefully?
- [ ] **Cleanup**: Are all listeners and instances destroyed on unmount?

## 2. Performance Validation
- [ ] **Jank-Free**: No visible stuttering on 60Hz/120Hz displays.
- [ ] **Composite Only**: Verify in DevTools that only `transform` and `opacity` are animating.
- [ ] **Main Thread**: No "Long Tasks" (>50ms) triggered by animation logic.
- [ ] **Memory**: No increasing memory footprint after repeated interactions.

## 3. Accessibility Validation
- [ ] **Reduced Motion**: Verify the fallback experience when OS "Reduce Motion" is on.
- [ ] **Focus Visibility**: Focus remains visible and logical during and after transitions.
- [ ] **Screen Readers**: Ensure `aria-live` or appropriate labels are used for motion-based updates.

## 4. Automated Validation (Playwright Style)
Use automated tests to verify motion properties.

```javascript
// Example Playwright test for motion
test('button scales on hover', async ({ page }) => {
  const button = page.locator('button');
  await button.hover();
  
  // Wait for animation frame
  await page.waitForTimeout(150); 
  
  const transform = await button.evaluate(el => window.getComputedStyle(el).transform);
  expect(transform).toContain('matrix'); // Verify transform is applied
});
```

## 5. Visual Regression
- [ ] Compare animation timing against the design spec (e.g., Lottie or video reference).
- [ ] Check for "ghosting" or "smearing" on high-motion elements.
