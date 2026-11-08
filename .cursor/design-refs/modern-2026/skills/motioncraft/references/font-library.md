# Font Library & Style Mapping

Use this library to select typography that aligns with specific brand styles and motion directions. Premium frontend experiences require motion and typography to be considered together.

## Style-to-Font Mapping

| Style | Primary (Commercial/System) | Open Source Alternative | Characteristics |
| :--- | :--- | :--- | :--- |
| **Apple** | SF Pro (System) | Inter / Geist | Neutral, high legibility, tight tracking |
| **Stripe** | Söhne | Inter / Public Sans | Geometric, modern, premium editorial feel |
| **Linear** | Inter | Inter | Functional, crisp, high x-height |
| **Vercel** | Geist | Geist | Monospaced influence, technical, minimal |
| **Premium** | Helvetica Now / Söhne | Inter (Tight) | Timeless, balanced, high-end |

## Curated Font Families

### 1. Inter (Open Source)
- **Best for**: Linear, Stripe-like, General Modern UI.
- **Usage**: Extremely versatile. Works well with tight letter-spacing (`-0.02em`).
- **Snippet**:
  ```css
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.022em;
  ```

### 2. Geist (Open Source)
- **Best for**: Vercel-style, Technical, Minimalist.
- **Usage**: Designed specifically for developers and modern interfaces.
- **Snippet**:
  ```css
  font-family: 'Geist', sans-serif;
  ```

### 3. SF Pro (System)
- **Best for**: Apple-style, iOS/macOS native feel.
- **Usage**: Use system font stacks to trigger SF Pro on Apple devices.
- **Snippet**:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  ```

### 4. Söhne (Commercial)
- **Best for**: Stripe-style, High-end Branding.
- **Usage**: Requires a commercial license from Klim Type Foundry.
- **Alternative**: Use **Inter** with custom weight tuning for a similar feel.

## CJK Fallback Strategy (Chinese/Japanese/Korean)

For Chinese-first or global outputs, ensure typography remains crisp and professional.

### Recommended CJK Stack
```css
font-family: 
  /* Western */
  "Inter", "Geist", -apple-system, 
  /* Chinese (Simplified) */
  "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", 
  /* Fallback */
  "Noto Sans CJK SC", "Source Han Sans SC", sans-serif;
```

### CJK Considerations
- **Weight**: Avoid "Bold" for CJK if possible; use "Medium" (500) for better legibility on low-DPI screens.
- **Line Height**: Increase line-height slightly for CJK text (e.g., `1.6` instead of `1.5`) to prevent visual crowding.

## Licensing & Usage Caveats

- **SF Pro**: Licensed only for use in mockups or apps running on Apple platforms. Do not self-host or use on non-Apple web platforms without checking current Apple EULA.
- **Söhne / Founders Grotesk**: High-cost commercial fonts. Always verify if the client has a license before including in production code.
- **Google Fonts**: Use `Inter`, `Public Sans`, or `Roboto Flex` for reliable, free, and high-performance web delivery.

## Typography + Motion Integration

- **Weight Transitions**: When animating font-weight, use **Variable Fonts** to avoid layout jumps and ensure smooth interpolation.
- **Letter Spacing**: Subtle `letter-spacing` animations can add a "premium" feel to headers during reveal.
- **Scale**: Prefer `transform: scale()` over `font-size` changes to keep animations on the GPU.
