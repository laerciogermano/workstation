# Modern UI + Motion (2026) — referência operacional

**Uso:** complementar o [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md) (Editorial Bold / anti-slop).  
Não substitui o DS — define **tendência de mercado + stack de animação React** para web apps.

Atualizado: 2026-11-08

---

## 1. Veredito do mercado (2026)

Tendência dominante **não** é “cyberpunk neon / tudo brilha”. É:

| Eixo | Direção 2026 |
|------|----------------|
| Visual | Personalidade tipográfica, grids quebrados com intenção, bento em marketing; **calm UI** em produto |
| Depth | Glass **restrito** (nav/overlay/modal), depth espacial (blur/opacity), não glass em tabelas/forms |
| Motion | Explica estado / guia atenção / confirma ação — **não** decora |
| Stack | CSS nativo primeiro → Motion (React UI) → GSAP (timeline/scroll story) → View Transitions (rotas) |
| Qualidade | INP / `transform`+`opacity` / `prefers-reduced-motion` |

**“Futurista de bom gosto”** neste lab = física de spring (Material Expressive / Apple HIG), shared-element transitions, micro-interações com propósito, tipografia variável cinética, 3D/WebGL só no momento herói — **sem** scanline, neon cyan/magenta default, preloaders decorativos, fade-up em tudo.

Anti-padrões (ainda “futuristas” de 2021–23): entrance autoplay em todo elemento, smooth-scroll que luta com o SO, hero video pesado como default, Midjourney blob genérico, purple gradient SaaS.

---

## 2. Stack React recomendada

```
CSS (transitions, @starting-style, scroll-driven, allow-discrete)
  └─ Motion / motion/react  → layout, gestures, AnimatePresence, springs
       └─ View Transitions API → rotas / shared elements
            └─ GSAP (+ ScrollTrigger) → scrollytelling, SplitText, timelines longas
                 └─ R3F / Three / Spline → 1 momento 3D (opcional)
```

| Camada | Quando |
|--------|--------|
| CSS | tooltip, popover, hover, reveal simples, progress de scroll |
| Motion | reorder de lista, drag, modal enter/exit, layoutId, springs |
| View Transitions | `/lista` → `/detalhe` com morph de card |
| GSAP | pin + scrub, história de scroll, SVG draw complexo |
| WebGL | um herói; nunca o default do dashboard |

Pacote: `motion` (`import { motion } from "motion/react"`). GSAP free desde 2025 (incl. plugins Club).

**Regra:** não usar Motion onde CSS resolve; não usar AnimatePresence em elemento que também é shared View Transition.

---

## 3. Tokens de motion (produto)

Espelhar Material 3 Expressive em espírito:

- **Spatial** (x/y/scale/rotate): spring com leve overshoot em momentos herói
- **Effects** (opacity/color): spring **sem** overshoot
- Velocidades: `fast` (controles), `default` (sheets), `slow` (fullscreen)

Heurística web app (produto):

| Tipo | Duração / feel | Easing |
|------|----------------|--------|
| Micro (toggle, press) | 120–200ms | spring stiff ou ease-out curto |
| UI state (drawer, toast) | 200–320ms | spring standard |
| Route / shared element | 280–450ms | View Transition CSS |
| Marketing reveal | 0.5–1.2s stagger 80–120ms | expo-out / spring soft |

Sempre:

```css
@media (prefers-reduced-motion: reduce) {
  /* reduzir ou remover movimento espacial; manter fade curto se útil */
}
```

Chrome: **não** aplicar `animation-duration: 0.01ms` global — tratar caso a caso.

---

## 4. Padrões visuais que “shipam”

### Produto / web app
- Calm hierarchy, whitespace estrutural, defaults óbvios
- Dark mode com tokens (não invert)
- Skeleton > spinner
- Glass só em camada funcional flutuante
- Shadows em camadas (espacial) em vez de um `shadow-lg`

### Marketing / landing
- Bento grid (4–9 tiles; não forçar em ERP densos)
- Kinetic / variable type
- Scrollytelling com pin quando a história merece
- Personalidade tipográfica > template Inter/Geist

### “Futurista” premium (web)
- Material Expressive springs + Apple Liquid Glass **como metáfora** (camada de chrome translúcida sobre conteúdo)
- Depth por blur/opacity, morfismo de forma em controles-chave
- View Transitions shared-element (sensação de app nativo)
- 3D seletivo ou SVG cinético — não HUD cyberpunk default

---

## 5. Checklist rápido antes de shipar

- [ ] Animação passa o teste: “sem ela, o UI comunica pior?”
- [ ] Só `transform` / `opacity` (e filter com cuidado)
- [ ] `prefers-reduced-motion` coberto
- [ ] INP: motion não bloqueia interação
- [ ] Não conflita com DS Editorial Bold / anti-slop (salvo direção declarada)
- [ ] Glass/3D/scrollytelling justificados pelo contexto (marketing ≠ dashboard)

---

## 6. Onde aprofundar (neste pacote)

| Caminho | Conteúdo |
|---------|----------|
| [skills/motioncraft/](skills/motioncraft/SKILL.md) | Sistema de motion → código (streams landing, tokens, a11y) |
| [skills/neej-frontend-craft/](skills/neej-frontend-craft/SKILL.md) | Craft 2026: tokens OKLCH, Motion, eval, refs Linear/Vercel |
| [skills/motion-site-builder/](skills/motion-site-builder/SKILL.md) | 5 perfis (cinematic/product-ui/editorial/…) + lint motion |
| [skills/review-motion/](skills/review-motion/SKILL.md) | Review de motion |
| [skills/improve-motion/](skills/improve-motion/SKILL.md) | Plano de melhoria |
| [skills/frontend-design-philosophies/](skills/frontend-design-philosophies/SKILL.md) | Filosofias nomeadas (Rams, etc.) |
| [skills/premium-design-kinetic-luxe/](skills/premium-design-kinetic-luxe/SKILL.md) | Editorial luxe + motion intencional |
| [skills/motion-site-builder-prompts/](skills/motion-site-builder-prompts/) | Prompts de referência por archetype |
| [articles/](articles/README.md) | Resumos das fontes web 2026 |
| [REACT-ANIMATION-STACK.md](REACT-ANIMATION-STACK.md) | Decisão CSS / Motion / VT / GSAP |

Skills anti-slop existentes (obrigatórias no lab): [../SOURCES.md](../SOURCES.md)
