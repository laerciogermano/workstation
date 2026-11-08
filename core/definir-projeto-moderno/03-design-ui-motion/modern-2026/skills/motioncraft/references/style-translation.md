# Style Translation

Use this file when the user describes the effect with brand, mood, or taste words instead of implementation terms.

## Translation Axes

Translate style language into decisions along these axes:

- rhythm: restrained, moderate, expressive
- force: soft, medium, strong
- depth: flat, layered, spatial
- transition style: direct, eased, spring-led, timeline-led
- accent level: none, subtle, visible, theatrical

## Apple

- rhythm: restrained
- force: soft to medium
- depth: layered and spatial
- transition style: eased or lightly spring-led
- accent level: subtle

Practical mapping:
- Use small travel distances
- Pair opacity with transform
- Prefer clear hierarchy over decorative motion
- Use spring only when it improves tactility, not spectacle
- For scroll scenes, reveal layers progressively and preserve calm pacing

## Stripe

- rhythm: moderate and flowing
- force: soft
- depth: layered
- transition style: eased, staggered, or ambient timeline motion
- accent level: visible but polished

Practical mapping:
- Use gradient drift, light sweeps, and stacked cards
- Keep background motion ambient
- Let surfaces and lighting move more than text blocks

## Linear

- rhythm: short and precise
- force: medium
- depth: controlled, not dramatic
- transition style: direct or tightly eased
- accent level: subtle

Practical mapping:
- Keep hover feedback crisp and efficient
- Avoid over-bounce
- Use sharp transitions, not theatrical reveals

## Vercel

- rhythm: restrained
- force: soft
- depth: low to medium
- transition style: direct and minimal
- accent level: subtle

Practical mapping:
- Use small opacity and transform shifts
- Keep motion secondary to typography and layout
- Prefer elegant restraint over animation density

## Generic Mood Words

- `premium`, `high-end`, `with texture`: add depth, careful easing, local highlights, and tighter parameter tuning
- `silky`, `smooth`: reduce abruptness, avoid sharp overshoot, keep transitions coherent
- `tech`, `futuristic`: increase crispness, controlled light effects, stronger spatial cues
- `playful`: allow more overshoot, larger motion ranges, and brighter accents
- `minimal`: shrink motion range, shorten duration, reduce decorative layers

When the user provides both a brand and a concrete effect, let the effect type define the structure and let the style reference tune the parameters.
