# Logo — veredito para IA

Pacote canônico para criar **logos** de projetos. Preferir SVG hand-authored / auditado; modelos de imagem geram **conceito**, não master.

Sistema completo (cor + tipo + voz + motion + `BRAND.md`): [`../05-identidade-visual/IDENTIDADE-VISUAL.md`](../05-identidade-visual/IDENTIDADE-VISUAL.md).

## 1. O que uma logo é (e não é)

| É | Não é |
|---|---|
| Identificador / bandeira / assinatura | Explicação do negócio |
| Deriva significado da qualidade do produto no tempo | Magia que “salva” produto ruim |
| Distintivo, visível, usável, memorável, universal, durável, atemporal | Ilustração detalhada / poster / mockup |
| Funciona em 1 cor e em ~16 px | Dependente de gradiente, glow, textura ou foto |

> “A logo doesn’t sell (directly), it identifies.” — Paul Rand, *Logos, Flags, and Escutcheons* (1991)

**Logo ≠ identidade ≠ marca** — identidade vive em [`05-identidade-visual/`](../05-identidade-visual/README.md).

## 2. Princípios operacionais

1. Brief antes do pixel  
2. Uma ideia clara  
3. Identificar, não ilustrar  
4. Simplicidade como subproduto de ideia boa  
5. Distinção vs. clichês da categoria  
6. Legível em 16 px  
7. Monocromático primeiro  
8. Família de variantes (não desenho único)  
9. Longevidade > tendência  
10. Gestalt / silhueta (blur/squint)

Detalhe: [`skills/logo-design/references/principles.md`](skills/logo-design/references/principles.md)

## 3. Tipos (escolher ≥2 rotas)

Wordmark · Lettermark · Pictorial · Abstract · Combination · Emblem · Mascot  

Guia: [`skills/logo-design/references/mark-types.md`](skills/logo-design/references/mark-types.md)

## 4. Fluxo

```text
Brief → clichês da categoria → word map → 3 conceitos (tipos diferentes)
  → checkpoint → SVG limpo → testes → kit de variantes
```

1. Discovery: [`skills/logo-design/references/discovery-brief.md`](skills/logo-design/references/discovery-brief.md)
2. SVG: [`skills/logo-design/references/svg-construction.md`](skills/logo-design/references/svg-construction.md)
3. Testes: [`sintese/checklist-producao.md`](sintese/checklist-producao.md)
4. Prompts: [`prompts/FORMULAS-E-TEMPLATES.md`](prompts/FORMULAS-E-TEMPLATES.md)

Não entregar kit completo antes do checkpoint (salvo pedido explícito).  
Depois do mark aprovado → [`05-identidade-visual/`](../05-identidade-visual/README.md).

## 5. Skills

| # | Skill |
|---|---|
| 1 | [`skills/logo-design/`](skills/logo-design/SKILL.md) |
| 2 | [`skills/logo-creation/`](skills/logo-creation/SKILL.md) |
| 3 | [`skills/logo-kit-svg/`](skills/logo-kit-svg/SKILL.md) · svg-logo-system · logo-generator · rampstack |

## 6. Anti-padrões

Purple glow · 3D glossy · mockup shadow · texto ilegível de image model · microtexto em anel · cópia de marca famosa · PNG como master

## 7. Entregáveis mínimos (logo)

- `icon.svg` · lockups horizontal/stacked · `mono-black.svg` / `mono-white.svg`
- Favicon / app icon 16–512

Guidelines de marca, tokens e motion: pacote [`05`](../05-identidade-visual/templates/BRAND.md).

## 8. Caminho inverso

- Identidade completa → `05-identidade-visual/`
- Só UI → `03-design-ui-motion/DESIGN-SYSTEM.md`
- Remover → [`README.md`](README.md) Rollback
