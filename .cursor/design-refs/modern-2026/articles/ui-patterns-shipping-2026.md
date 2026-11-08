# UI patterns que realmente shipam (2026)

Fonte: https://rajeshrnair.com/design/ui-ux/ui-design-trends-2026-bento-grids-glassmorphism/  
Baixado: 2026-11-08

## Bento

- CSS Grid + spans / named areas
- Bom em marketing / features
- **Ruim** em dashboards densos / ERP (conflita com scanning uniforme)
- A11y: DOM em ordem lógica; visual via grid, não `order` cego

## Glass 2026 (refinado)

```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.08);
border: 1px solid rgba(255, 255, 255, 0.15);
```

Usar: sidebar flutuante, modal, nav sobre foto.  
Evitar: tabelas, forms, todo card da página.  
Fallback sólido + teste em GPU fraca.

## Type variável + expressiva

Menos requests de font; headline como elemento gráfico (com tipografia **distinta** — evitar Inter default no lab).

## Micro-animação com propósito

Teste: remover → UI piora? Senão, remova.  
Budget mobile: motion JS leve; testar mid-range.

## Dark mode

Tokens + design próprio (não invert). `prefers-color-scheme` + override localStorage.

## Spatial influence (Vision-like em 2D)

Depth por blur/opacity e shadows em camadas — não só `box-shadow` único.
