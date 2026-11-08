# Brand guidelines — [NOME]

> One-pager operacional. Preencher após logo aprovado. Versão: [YYYY-MM-DD]

## 1. Essência

- **O que é:** […]
- **Para quem:** […]
- **Personalidade (3–5):** […]
- **Uma frase de posicionamento:** […]

## 2. Logo system

| Variante | Arquivo | Quando |
|----------|---------|--------|
| Primary lockup horizontal | `lockup-horizontal.svg` | Web header, docs |
| Stacked | `lockup-stacked.svg` | Espaços estreitos |
| Icon / mark | `icon.svg` | Avatar, favicon base |
| Glyph 16–32 | `glyph.svg` | Favicon, tab |
| Mono black | `mono-black.svg` | Print 1 cor |
| Mono white | `mono-white.svg` | Sobre fundo escuro |

- **Clear space:** [unidade = altura do mark / cap-height]
- **Mínimo digital:** [ex. 24px altura wordmark; 16px icon]
- **Fundos OK:** branco · ink · [brand] · foto com overlay

### Não fazer

1. Esticar / distorcer  
2. Recolorir fora da palette  
3. Adicionar glow, sombra, outline, gradiente no master  
4. Colocar sobre foto busy sem placa/contraste  

## 3. Cor

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | #______ | […] |
| `--color-secondary` | #______ | […] |
| `--color-accent` | #______ | […] |
| `--color-ink` | #______ | Texto |
| `--color-paper` | #______ | Fundo |
| `--color-muted` | #______ | Secundário |

Dark: ver `tokens.css`. Pares AA documentados: [lista].

## 4. Tipografia

| Papel | Família | Pesos | Uso |
|-------|---------|-------|-----|
| Display | […] | […] | Títulos / marca |
| Body | […] | […] | UI / texto |
| Mono (opc.) | […] | […] | Código / dados |

Escala: Display / H1 / H2 / H3 / Body / Small / Caption — tamanhos em `tokens.css`.

## 5. Voz

- **Sliders:** formal←→casual · sério←→playful · técnico←→humano  
- **Do:** […] · […] · […]  
- **Don't:** […] · […] · […]  
- **Before → After:** “[…]” → “[…]”

## 6. Imagery / ícones

- Fotografia: [luz, assunto, proibido]
- Ícones: stroke [px], corner [px], grid [px], filled/outline

## 7. Motion

Ver [`motion-guidelines.md`](motion-guidelines.md) ou resumo:

- Signature move: […]
- Durações: micro […] / default […] / slow […]
- Easing: […]
- Reduced-motion: fade/instant only
- Logo nunca: stretch, spin infinito, recolor não autorizado

## 8. Acessibilidade

- Contraste texto ≥ AA (preferir AAA em body)  
- Não transmitir estado só por cor ou só por motion  
- Foco visível; sem flash

## 9. AI content rules

| Pode sem review | Precisa humano |
|-----------------|----------------|
| Rascunho copy com voz | Logo / lockup novo |
| Layout interno com tokens | Campanha externa / ads |
| Ícones no stroke system | Qualquer 3D/hero generativo |

Proibido em prompts de imagem: ver `modern-2026/prompts/ANTI-SLOP-E-TENDENCIA.md`.

## 10. Canais

| Canal | Mark | Nota de tom |
|-------|------|-------------|
| App / web | […] | […] |
| Social avatar | glyph | […] |
| Print | mono | […] |
