---
name: visual-identity
description: >-
  Use after ux-methodology-design is complete. Defines brand personality
  keywords, explores typography, expands the color system, and locks a motion
  vocabulary before any code is written. Outputs design-system.md ready for
  motion-web-design. Award-winning studios run this phase before implementation.
---

# Visual Identity

Lock the design language before touching code. Locomotive, Active Theory, and Resn consistently define brand personality, typography, and motion vocabulary as a deliberate pre-build phase. Skipping it produces sites that look "professional but generic" — correct structure, flat feeling. This skill formalizes that phase.

**Distinction:** [ux-methodology-design](../ux-methodology-design/SKILL.md) determines *how to present content* (hierarchy, CTA emphasis, feedback timing). This skill determines *what the brand looks and moves like* — the personality, typeface, color depth, and motion signature that make the site feel distinctly itself.

## When to Apply

- After ux-methodology-design — you have architecture and design rules, but no visual language
- Before motion-web-design — the build needs a visual brief, not just a layout spec
- When a site looks "correct but generic" — usually a missing visual identity phase
- When the team can't agree on what the site should "feel like"

## Workflow

Copy this checklist:

```
Visual Identity:
- [ ] 1. Brand personality — 4–5 keyword adjectives
- [ ] 2. Visual translation — map each keyword to a design decision
- [ ] 3. Typography exploration — test 3 display treatments
- [ ] 4. Typography selection — document the pair and rationale
- [ ] 5. Color system — expand from palette seeds to full token set
- [ ] 6. Texture decision — grain, gradient, or clean
- [ ] 7. Motion vocabulary — name 4 signature moves with GSAP shorthand
- [ ] 8. Preset selection — match to motion-web-design archetype
- [ ] 9. Write design-system.md
```

---

## Phase 1: Brand Personality Keywords

Define 4–5 adjectives that capture how the brand should *feel*. These act as a creative filter: if a design decision doesn't serve one of these words, cut it.

**How to find them:** Look at the primary persona's core tension (want vs. fear from persona-archetypes), the copy tone already established, and the trust signals the audience values from audience-research.

**Output format:**

| Keyword | Visual Translation |
|---------|--------------------|
| [word]  | [what this means in type, color, spacing, and motion] |

**Example (sports hydration brand, Hero archetype, Achiever VALS):**

| Keyword | Visual Translation |
|---------|-------------------|
| Electric | Neon/lime accent; fast stagger animations; high contrast on dark |
| Earned | Subtle grain texture; heavy type weights; no decorative illustration |
| Precise | Strict grid; ingredient numbers sized as display type; no visual noise |
| Raw | Maximum font weight (900); athlete photography over product renders |
| Clean | One accent color; generous whitespace; restraint over ornament |

**Rules:**
- More than 5 keywords means you haven't made choices — compress to 5 max
- Each keyword must have a concrete visual translation, not just a vibe
- Contradictory keywords (e.g., "bold" AND "delicate") expose a positioning conflict to resolve before design starts

---

## Phase 2: Typography Exploration

Test exactly 3 display font pairs. More creates paralysis; fewer creates false certainty.

**What to test:** Render the hero headline (primary H1 from page architecture) at full display scale (~96px). The right pair makes that headline feel physically powerful and differentiated.

**Font candidates by brand personality:**

| Brand feel | Display options | Body pair |
|------------|----------------|-----------|
| Athletic / Performance | Barlow Condensed, Bebas Neue, Anton, Big Shoulders Display | Inter, DM Sans |
| Technical / Precise | Space Grotesk, IBM Plex Mono, Neue Haas Display | Inter, Roboto Mono |
| Premium / Luxury | Playfair Display, Cormorant Garamond, Editorial New | DM Sans, Plus Jakarta Sans |
| Bold / Rebel | Black Han Sans, Alfa Slab One, Syne | Inter, Space Grotesk |
| Creative / Editorial | Clash Display, Syne, PP Neue Montreal | Plus Jakarta Sans, Space Grotesk |
| Clean / Minimal | Geist, Instrument Sans, Satoshi | Inter |

**Evaluation criteria:**
1. **Personality match** — Does it reinforce the keyword list?
2. **Scale legibility** — Does it read at 96px AND remain clear at 24px?
3. **Character distinction** — Does it look like *something*, or just a default sans?
4. **Weight range** — Are 700–900 weights available for maximum emphasis?

**Selection output (put in design-system.md):**
```markdown
## Typography
- Display/H1: [Font] [weights used] — [1-sentence rationale tied to keyword]
- Body: [Font] [weights used]
- Google Fonts import: [URL]
```

---

## Phase 3: Color System

Expand from palette seeds to a full named token set. Color systems fail when they have only 2–3 named values; you need semantic names for every shade used in the build.

**Derivation pattern (from one accent + one background):**

```
{accent}-bright:  +15% lightness — highlight, hover glow
{accent}:         Source color — primary CTAs, key accents
{accent}-muted:   -15% lightness — secondary usage, text on accent bg
{accent}-dim:     90% white + 10% accent — badge fills, tinted light sections

dark:           Page base (darkest bg)
dark-surface:   Secondary sections (+4–6% lightness)
dark-card:      Elevated cards (+3% lightness from surface)
dark-border:    Borders, dividers (subtle, ~15% lightness)

white:          #FFFFFF
gray-light:     Body text on dark (high legibility — ~75% lightness)
gray:           Secondary text, labels (~55% lightness)
```

**Minimum token count: 12 named variables.** Fewer forces ad-hoc colors during build.

### Texture Decision (mandatory, not optional)

Choose one — this single decision closes most "flatness" gaps:

| Option | When to use | Implementation |
|--------|-------------|----------------|
| **Grain overlay** | Earned, Raw, bold brands | SVG noise filter, 3–5% opacity, `position: fixed` |
| **Gradient surface** | Precise, Premium, Clean | Subtle `linear-gradient` on dark sections (~5° color shift) |
| **Textured gradient** | Electric, Creative | Radial glow spots + grain combined |
| **Flat / none** | Minimal, Lithos, pure architecture | Only if whitespace alone carries the weight |

**Grain implementation (copy-paste):**
```css
/* Add to body in base.css */
body::after {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
  z-index: 9998;
}
```

---

## Phase 4: Motion Vocabulary

Name exactly 4 signature moves. Every animation in the built site derives from one of these. No ad-hoc, one-off animations.

**Template:**

| Name | Description | GSAP shorthand | Used in |
|------|-------------|----------------|---------|
| **LIFT** | Element rises from below with fade, cubic ease-out | `from({y:40, opacity:0}, {ease:'power3.out', duration:0.6})` | All section entrances |
| **REVEAL** | Text unmasks left→right behind a clipping rect | `from({clipPath:'inset(0 100% 0 0)'}, {clipPath:'inset(0 0% 0 0)', ease:'power3.inOut', duration:0.7})` | Hero H1, section headings |
| **COUNT** | Number animates 0 → final on scroll enter | `gsap.to({val:0},{val:target,onUpdate: ()=>el.textContent=Math.round(this.targets()[0].val)})` | Stats bar, social proof |
| **PULSE** | Scale 1→1.03 + glow on hover, spring overshoot | `to(el,{scale:1.03,ease:'back.out(1.7)',duration:0.2})` | CTAs, primary buttons |

**Intensity calibration by personality:**

| Brand personality | LIFT duration | REVEAL speed | PULSE overshoot |
|-------------------|--------------|--------------|-----------------|
| Electric / Bold | 0.5s, power3.out | 0.55s, fast | back.out(2.5) |
| Precise / Clean | 0.7s, power2.out | 0.8s, measured | back.out(1.4) |
| Premium / Luxury | 1.0s, power1.out | 1.1s, very slow | back.out(1.2) |
| Creative / Editorial | 0.65s, power3.inOut | 0.75s, cinematic | back.out(1.8) |

---

## Phase 5: Preset Selection

Match the brand personality to a visual archetype from [motion-web-design/presets.md](../motion-web-design/presets.md). The preset sets default values for colors, spacing, typography usage, and motion intensity — overrides are specified per module.

See [motion-web-design/archetypes.md](../motion-web-design/archetypes.md) for the persona → preset mapping table.

---

## Phase 6: Design System Output

Write `design-system.md` in the project directory. This is the complete handoff to motion-web-design.

```markdown
# Design System: [Project Name]

## Brand Personality
| Keyword | Visual Translation |
[5 rows]

## Typography
- Display: [font, weights, rendering at hero scale]
- H1–H3: [per-level specs]
- Body, Caption: [specs]
- Import: `[Google Fonts URL]`

## Color Tokens
```css
:root {
  --accent-bright: [hex];
  --accent:        [hex];
  --accent-muted:  [hex];
  --accent-dim:    [hex];
  --dark:          [hex];
  --dark-surface:  [hex];
  --dark-card:     [hex];
  --dark-border:   [hex];
  --white:         #FFFFFF;
  --gray-light:    [hex];
  --gray:          [hex];
}
```

## Texture
[Choice + implementation note]

## Motion Vocabulary
| Name | GSAP shorthand | When |
[4 rows with intensity calibrated to brand]

## Preset
[Preset name] — [rationale in 1 sentence linking persona to preset]
```

---

## Quality Gate

Before handing off to motion-web-design:

- [ ] Brand keywords feel specific, not generic ("electric" not "modern")
- [ ] Each keyword has a concrete visual translation (not just a vibe)
- [ ] Typography renders the hero headline with personality at 96px
- [ ] Color token set has ≥12 named variables with semantic names
- [ ] Texture decision made — not deferred
- [ ] All 4 motion vocabulary moves named with GSAP shorthand
- [ ] Motion intensity calibrated to brand keywords
- [ ] Preset selection justified by persona signals (reference archetypes.md)
- [ ] design-system.md is written and self-contained

---

## Anti-Patterns

- **Too many adjectives** — 8 "brand values" is not a personality; it's a hedge. Force the 5-max rule.
- **Generic fonts** — "I'll just use Inter" skips the exploration phase and produces bland output
- **Color before personality** — picking lime because it looks good before defining keywords creates arbitrary choices
- **Motion without vocabulary** — adding "some animation" without naming the moves creates an inconsistent experience
- **Deferred texture** — "We'll add texture later" never happens; the site ships flat
- **Adjectives without translations** — "minimalist" with no CSS/typography rule attached is worthless in a brief

---

## Additional Resources

- [motion-web-design/presets.md](../motion-web-design/presets.md) — 8 visual archetypes
- [motion-web-design/archetypes.md](../motion-web-design/archetypes.md) — Persona → preset mapping
- [persona-archetypes/synthesis.md](../persona-archetypes/synthesis.md) — Persona psychology → site style mapping
