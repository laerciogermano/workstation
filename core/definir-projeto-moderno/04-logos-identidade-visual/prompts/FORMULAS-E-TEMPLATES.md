# Fórmulas de prompt — logo

Fontes: ManyPixels (2026), SVG Genie, skills locais. Adaptar ao brief; não copiar metáfora de marca existente.

## A. Conceito raster (Midjourney / GPT-Image / Gemini Image)

### Fórmula 5 partes

```text
[1 Subject concreto] + [2 Style] + [3 Palette 2–3 cores] + [4 Mood] + [5 Technical constraints]
```

Exemplo fraco: `cool coffee logo`  
Exemplo forte:

```text
A minimalist coffee bean mark formed from two intersecting curved lines,
thin single-weight stroke, warm brown and cream, cozy artisanal mood,
flat vector, white background, 1:1, no text, no shadows, no texture.
```

### Bloco de produção (colar no fim)

```text
Production constraints: flat vector design, transparent or pure white background,
clean silhouette, maximum three colors, solid fills only,
no photo texture, no 3D, no glow, no mockup shadow, no fine line details,
no small text, no slogan, SVG-friendly large shapes, readable at 16px favicon,
must work as one-color stamp.
```

### Negativos úteis

```text
--no gradient, texture, shadow, grain, noise, blur, photorealistic, watercolor, 3D render
```

(ou equivalente em prosa no modelo)

### Separar mark e wordmark

Pedidos de imagem: preferir `no text` / `symbol only`. Tipografia do nome: ferramenta tipográfica / SVG à parte (modelos ainda destroem letterforms).

## B. Prompt para agente (SVG / skill)

```text
Crie logo para [NOME], [o que faz], audiência [quem], adjetivos [3–5],
concorrentes a evitar [lista]. Explore 3 conceitos em tipos de marca diferentes.
Checkpoint antes do kit. Master em SVG com viewBox, paths, sem raster.
Passar: 16px, monocromático, reversed, blur/squint. Entregar icon + lockups + mono + favicon.
Usar referências de core/definir-projeto-moderno/04-logos-identidade-visual/ (LOGO-IDENTIDADE + skill logo-design).
```

## C. Fórmula SVG Genie (negócio → produção)

```text
[business or product] + [logo type] + [one visual metaphor] + [style] + [colors] + [SVG production constraint]
```

```text
Independent bookkeeping studio, geometric lettermark logo, open ledger forming a subtle B,
modern minimal style, forest green and slate, flat SVG-friendly shapes,
transparent background, readable as a one-color favicon.
```

## D. Templates por job

| Job | Padrão |
|---|---|
| Symbol | `Simple geometric [object] mark for [business], flat vector, 2 colors, transparent bg, works at 32px` |
| Lettermark | `Custom [letter(s)] monogram, clean negative space, balanced stroke, modern vector, one-color required` |
| Wordmark | `Readable wordmark for [brand], custom sans lettering, simple spacing, no icon, black on transparent` |
| Badge | `Compact badge for [business], simplified emblem, limited detail, clean SVG outline, readable on labels` |
| App icon | `Rounded-square app icon, single clear symbol, high contrast, no words, simplified geometry, SVG export` |

## E. Brief mínimo (antes de qualquer prompt)

```text
Nome (grafia exata):
O que faz (1 frase):
Para quem:
Adjetivos (3–5):
Promessa / emoção (1):
Onde aparece (favicon, header, print, app…):
Cores obrigatórias / proibidas:
Concorrentes / clichês a evitar:
```
