# Motion + View Transitions + CSS (síntese)

Fonte: https://themotiondesign.com/writing/motion-for-react-view-transitions  
Baixado: 2026-11-08

## Divisão de trabalho

| Tool | Lane |
|------|------|
| Motion | layout, gestures, presence, springs |
| View Transitions | navegação / shared element entre rotas |
| CSS | enter/exit simples, scroll-linked, discrete display |

## Gotcha

`AnimatePresence` + `startViewTransition` competem no timing do DOM.  
Padrão: shared elements de rota → CSS/`::view-transition-*`; AnimatePresence só in-page.

## Critério de qualidade

Boa animação é notada pela **ausência**, não pela presença. Menor tool que satisfaz a constraint.
