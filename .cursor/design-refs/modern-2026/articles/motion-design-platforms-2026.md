# Plataformas: M3 Expressive, Liquid Glass, Chrome Motion

Baixado: 2026-11-08

## Material 3 Expressive — motion physics

Fonte: https://m3.material.io/styles/motion/overview/how-it-works

- Substitui sistema antigo baseado só em duration/easing
- Schemes: **expressive** (bounce/overshoot herói) e **standard** (utilitário)
- Springs: stiffness + damping + initial velocity
- Tokens: spatial vs effects × fast/default/slow
- Spatial pode overshoot; effects (opacity/color) **não**

Web: compatível com springs estilo Compose — mapear para Motion springs.

## Apple — motion + Liquid Glass

Fontes:
- https://developer.apple.com/design/human-interface-guidelines/motion
- https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- WWDC25 “Meet Liquid Glass”

Princípios:
- Motion com propósito; opcional; cancelável
- Feedback realista alinhado ao gesto
- Brevidade; evitar motion em interações frequentes
- Liquid Glass = camada funcional (chrome) que dobra luz; **não** espalhar em todo controle custom
- Respeitar reduce transparency / reduce motion

Tradução web: glass restrito em nav/sheets; springs suaves; shared transitions.

## Chrome Modern Web Guidance — Motion

Fonte: https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion

- `clip-path` / `mask-image` para reveals
- Scroll-driven CSS em vez de listeners JS (efeitos não essenciais)
- View Transitions para layout complexos
- Preferir `opacity` + `transform`
- `@starting-style` + `allow-discrete` + `overlay` para entry/exit
- Reduced motion caso a caso (não `0.01ms` global)
