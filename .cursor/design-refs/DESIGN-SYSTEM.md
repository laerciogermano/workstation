# Design system — padrão workstation

**Status:** canônico (2026-11-07)  
**Showcase visual:** [`design-system.html`](design-system.html)  
**Uso:** todo HTML/CSS/UI/landing/dashboard/protótipo neste workspace, salvo marca de produto já documentada (`*/marca/`).  
**Base:** refs em [SOURCES.md](SOURCES.md) (unslop, Anthropic frontend-design, anti-ai-slop, templates Editorial/Suede, cookbook).

---

## 1. Princípio

Uma direção nomeada + tokens + componentes reutilizados. Sem “moderno limpo” genérico. Se remover o nome do produto e o layout ainda parecer SaaS médio / dashboard escuro mint / cream editorial automático → refazer.

**Default deste workspace: Editorial Bold** (unslop sample + alinhado a `anti-slop-templates/editorial/`).

Outras direções (Suede, Swiss, Terminal, Photo-led, Brutalist, Documentary) só com justificativa do produto — ver §7.

---

## 2. Tokens — Editorial Bold (default)

### Cor

| Token | Hex | Uso |
|-------|-----|-----|
| `--paper` | `#ffffff` | fundo |
| `--paper-2` | `#f4f1ea` | hover / superfície leve |
| `--ink` | `#14120f` | texto primário, bordas fortes |
| `--body` | `#44423d` | texto secundário (contraste alto) |
| `--accent` | `#e0402b` | um só accent (CTA, número, underline) |
| `--line` | `#e7e3db` | hairline |

Não usar mint `#3ecf8e`, indigo/violet, purple→blue, cream `#F4F1EA` + terracotta `#D97757` por reflexo.

### Tipografia

| Papel | Família | Peso | Notas |
|-------|---------|------|-------|
| Display / UI | **Archivo** | 700–800 | tracking ≈ `-0.02em`, sentence case |
| Corpo | **Newsreader** | 400–500 | line-height ≈ 1.55–1.6 |
| Meta / números | Archivo | 600 | `tabular-nums`; labels pequenos |

Proibido como default: Inter, Geist, Roboto, Arial, system-ui sozinho, Space Grotesk, Instrument Serif com palavra em itálico colorido.

### Espaço e forma

- Container índice/conteúdo: ≈ `1120px` (hub) ou `46–74rem` (editorial longo)
- Gutter: `1.25–3rem` fluido
- Gap de grid: `0.85rem`
- Radius: **6px** (não `rounded-2xl`)
- Separação: **hairline 1px** (`--line`), não soft-shadow em tudo
- Elevação: opcional só em hover leve (`translateY(-1px)` + fundo `--paper-2`); sem blur/glow

### Motion

- Default: quase nenhum
- Hover: ≤ 160ms, `cubic-bezier(0.16, 1, 0.3, 1)`
- Respeitar `prefers-reduced-motion`
- Proibido: fade-up em tudo, `scale-105` universal, count-up, marquee

---

## 3. CSS mínimo (copiar)

```css
:root {
  --paper: #ffffff;
  --paper-2: #f4f1ea;
  --ink: #14120f;
  --body: #44423d;
  --accent: #e0402b;
  --line: #e7e3db;
  --radius: 6px;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --font-display: "Archivo", system-ui, sans-serif;
  --font-body: "Newsreader", Georgia, serif;
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

::selection { background: var(--accent); color: var(--paper); }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
```

Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet" />
```

---

## 4. Componentes padrão

### 4.1 Card

- Fundo `--paper`, borda `1px solid var(--line)`, radius `6px`
- Conteúdo: meta (ícone Lucide + número opcional) → título Archivo → descrição Newsreader → ação “Abrir” / CTA com underline accent
- Ícones: **Lucide** (ou Heroicons/Phosphor), stroke 1.5, ≈ 1.35rem, **sem** caixa colorida arredondada
- Hover: borda `--ink`, fundo `--paper-2`
- Referência viva: [`index.html`](../../index.html) na raiz

### 4.2 Botão

- Primário: fundo `--ink`, texto `--paper`; hover → `--accent`
- Secundário: borda `--ink` / ghost com `--line`
- Sem gradiente; label = ação concreta (“Abrir”, “Salvar”), não “Get Started”

### 4.3 Link

- Underline accent (1.5px) ou hover vermilion
- Mesmo tratamento em toda a página

### 4.4 Seção / cabeçalho

- Título Archivo 800; lede em `--body`
- Divisor: hairline ou `2px solid var(--ink)` em seções principais
- Heading lidera — sem pill/eyebrow tracked-out acima do H1

### 4.5 Formulário (quando houver)

- Inputs com borda hairline, radius 6px, focus accent
- Labels Archivo small; erros em texto concreto, sem desculpas

---

## 5. Layout

- Preferir assimetria (ex.: título | lede) ou grid 2–3 colunas de cards iguais
- Quebrar o reflexo “hero centrado + 3 feature cards + CTA band”
- Mobile (~375px): 1 coluna; tap ≥ 44px; nav escondida ⇒ hamburger funcional

---

## 6. Copy e ícones

- PT-BR sentence case; hífen espaçado ou ponto — sem em-dash retórico
- Sem filler: seamless, unlock, elevate, transform your…
- Números reais quando existirem (`tabular-nums`)
- Ícones de biblioteca; nunca SVG “inventado” pelo modelo como marca

---

## 7. Direções alternativas (escape)

Só se o produto pedir. Declarar em 1 frase antes do CSS.

| Direção | Quando | Tokens / refs |
|---------|--------|----------------|
| **Editorial Bold** | default hub, docs, índices | este arquivo |
| **Editorial (Folio)** | marca literária / longform | `anti-slop-templates/editorial/` (Fraunces + Hanken, paper oklch) |
| **Suede** | ferramenta dark institucional | `anti-slop-templates/suede/` |
| **Swiss / Brutalist / Terminal / Photo-led / Documentary** | ver `anti-ai-slop/SKILL.md` | commitir uma; não misturar |

Marcas de produto (`conectmax/marca`, `e-notas/marca`, …) **vencem** este default quando o brief da marca existir.

---

## 8. Processo obrigatório

1. Ler este DS + [../skills/frontend-anti-slop/SKILL.md](../skills/frontend-anti-slop/SKILL.md)
2. Plano: assunto → audiência → job → direção → tokens
3. Codificar com classes/tokens únicos (sem utility solta inconsistente)
4. Self-check (qualquer sim = corrigir): Inter/Geist? Roxo/gradiente? Cream default? Body cinza? Pill? Icon-box grid? Soft-shadow everything? Em-dash? Fade-up all? Sem menu mobile?

Catálogo longo: [unslop-ui/TELLS.md](unslop-ui/TELLS.md).

---

## 9. Anti-exemplos deste workspace

| ❌ Não | ✅ Sim |
|--------|--------|
| Dark `#0f1419` + mint `#3ecf8e` | Paper/ink + vermilion |
| Instrument Serif + `<em>` colorido | Archivo display sólido |
| Cards escuros com SVG model-made em caixa | Cards brancos + Lucide inline |
| Eyebrow “Hub local” | H1 direto + meta discreta |
| Favoritos com fundo bege distinto | Mesmo card branco; seção só organiza |

---

## 10. Caminho inverso

- Voltar ao visual anterior do hub: git history de `index.html` (antes de 2026-11-07 Editorial Bold)
- Desativar regra: remover/ajustar `.cursor/rules/design-anti-slop.mdc` (não recomendado)
- Trocar default do DS: editar §2–§4 deste arquivo e alinhar `index.html` + skill

---

## 11. Checklist de PR / entrega visual

- [ ] Direção nomeada (default Editorial Bold ou escape justificado)
- [ ] Tokens do §2 (ou da marca do produto)
- [ ] Componentes do §4 sem slop do §9
- [ ] Ícones Lucide/Heroicons
- [ ] Mobile 375px ok
- [ ] `prefers-reduced-motion` ok
