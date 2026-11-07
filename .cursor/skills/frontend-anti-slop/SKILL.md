---
name: frontend-anti-slop
description: >-
  Art direction anti-AI-slop for any HTML/CSS/React/Tailwind UI, landing, dashboard,
  prototype or visual polish. Use BEFORE writing frontend code and whenever the user
  asks to design, redesign, restyle, beautify, or stop looking AI-made / generic / SaaS-default.
  Reads local downloaded refs under .cursor/design-refs/.
---

# Frontend anti-slop (obrigatório)

O usuário deste workspace **rejeitou** o design padrão do modelo. Não invente “moderno limpo” de cabeça — siga as refs baixadas.

## 1. Ler antes de codar (ordem)

1. Este arquivo
2. [SOURCES.md](../../design-refs/SOURCES.md) — mapa das refs
3. Distillado operacional: [unslop-ui/SKILL.md](../../design-refs/unslop-ui/SKILL.md)
4. Se precisar de catálogo: [unslop-ui/TELLS.md](../../design-refs/unslop-ui/TELLS.md)
5. Princípios Anthropic: [anthropic-frontend-design/SKILL.md](../../design-refs/anthropic-frontend-design/SKILL.md)
6. Checklist + direções: [anti-ai-slop/SKILL.md](../../design-refs/anti-ai-slop/SKILL.md)
7. Exemplos HTML reais: [anti-slop-templates/editorial/](../../design-refs/anti-slop-templates/editorial/) ou `suede/`
8. Prompt curto: [claude-cookbook/DISTILLED_AESTHETICS_PROMPT.md](../../design-refs/claude-cookbook/DISTILLED_AESTHETICS_PROMPT.md)

## 2. Processo (2 passes)

1. **Plano** (antes do código): assunto → audiência → job da tela → **uma** direção (Editorial Bold / Swiss / Terminal / Photo-led / Documentary / Brutalist — ou fusion explícita). Tokens: 4–6 hex, 1–2 famílias tipográficas, layout em 1 frase + ASCII.
2. **Auditoria do plano**: se parece com o que você faria para *qualquer* página SaaS / dark dashboard / cream editorial → mudar.
3. **Código** alinhado aos tokens.
4. **Self-check** do unslop (qualquer “sim” = corrigir): Inter/Geist? Gradiente/roxo? Cream default? Body cinza? Eyebrow/pill? Icon-card grid? Card shadcn soft? Em-dash? Fade-up em tudo? Sem menu mobile?

## 3. Ban list deste workspace (além das refs)

Nunca como default:

- Dark `#0f1419` / `#171e26` + accent mint `#3ecf8e`
- Instrument Serif + uma palavra em `<em>` colorida
- Eyebrow “Hub local” / pills tracked-out
- Grid de cards com ícone SVG model-made em caixa arredondada
- Radial gradients decorativos + shadow card hover lift
- Inter, Roboto, Arial, system-ui sozinho; Space Grotesk / Geist por reflexo
- Purple→blue, glassmorphism, mesh blobs, `rounded-2xl` universal
- Cream `#F4F1EA` + serif + terracotta `#D97757` sem o produto pedir editorial

## 4. Preferências positivas

- Humano e sofisticado: tipografia com contraste real, paper/ink ou direção *nomeada*, hairlines, assimetria, conteúdo concreto
- Imagem real quando o brief pedir visual (screenshot/foto), não SVG decorativo genérico
- Uma accent; hierarquia tipográfica forte; motion mínima e justificada
- Variar entre projetos — **não** convergir no mesmo look em gerações seguidas

## 5. Exemplo local a não repetir

O `index.html` legado da raiz (cards escuros + mint + Instrument Serif) é o **anti-exemplo**. Qualquer redesign deve se afastar dele e, quando for índice de projetos, preferir lista tipográfica / índice editorial (ver unslop Editorial Bold + `anti-slop-templates/editorial/`).
