---
name: modern-ui-motion
description: >-
  Tendências 2026 de UI/UX moderna + stack React de animação (CSS, Motion, View
  Transitions, GSAP). Use ao planejar ou implementar front-end moderno/futurista
  de bom gosto, web apps, landing com motion, micro-interações ou transições de rota.
  Complementa frontend-anti-slop — não substitui Editorial Bold.
---

# Modern UI + Motion (2026)

## 1. Ler primeiro

1. [MODERN-UI-MOTION.md](../../design-refs/modern-2026/MODERN-UI-MOTION.md) — veredito + checklist
2. [REACT-ANIMATION-STACK.md](../../design-refs/modern-2026/REACT-ANIMATION-STACK.md) — CSS / Motion / VT / GSAP
3. Continua obrigatório: [frontend-anti-slop](../frontend-anti-slop/SKILL.md) + [DESIGN-SYSTEM.md](../../design-refs/DESIGN-SYSTEM.md)

## 2. Princípios

- Motion **explica** (estado, foco, confirmação) — não decora
- Futurista premium ≠ neon cyberpunk / purple glow / fade-up em tudo
- Calm UI em produto; personalidade tipográfica + bento/scrolly em marketing
- Glass/3D só onde a camada funcional ou o herói merecem
- `transform`/`opacity` + `prefers-reduced-motion` + INP

## 3. Stack default (React)

CSS → `motion/react` → View Transitions (rotas) → GSAP (story/timeline) → R3F (1 herói)

Detalhe e código: `REACT-ANIMATION-STACK.md`.

## 4. Skills baixadas (aprofundar)

| Skill | Quando |
|-------|--------|
| [motioncraft](../../design-refs/modern-2026/skills/motioncraft/SKILL.md) | Decompor motion → implementação |
| [neej-frontend-craft](../../design-refs/modern-2026/skills/neej-frontend-craft/SKILL.md) | Craft completo + eval |
| [motion-site-builder](../../design-refs/modern-2026/skills/motion-site-builder/SKILL.md) | Perfis cinematic/product-ui/… |
| [review-motion](../../design-refs/modern-2026/skills/review-motion/SKILL.md) | Auditar motion |
| [improve-motion](../../design-refs/modern-2026/skills/improve-motion/SKILL.md) | Plano de upgrade |
| Prompts | [motion-site-builder-prompts/](../../design-refs/modern-2026/skills/motion-site-builder-prompts/) |

Artigos: [articles/](../../design-refs/modern-2026/articles/README.md)

## 5. Escape de direção

Se o brief pedir “cyberpunk HUD / neon”: declarar direção explícita (fora do DS default) e ainda assim respeitar a11y + performance.
