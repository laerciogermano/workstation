# Cupido — Identidade visual

Tokens e regras da marca. Manual print-ready: [`marca/identidade-visual-cupido-v1.html`](marca/identidade-visual-cupido-v1.html) · benchmarking: [`marca/benchmarking-concorrentes/`](marca/benchmarking-concorrentes/README.md).

**Craft:** resurso de confiança + calor humano (não “dating neon”, não cluster roxo-on-black).

---

## 1. Conceito

**Cupido** é o agente que trabalha no escuro até o fit. Visual **claro, íntimo e confiante**: coral de conexão + teal de agente/IA + ink quase-preto. Sem coração candy, sem glow cyberpunk.

**Nome de marca:** `Cupido` (wordmark). Pasta/código: `cupido`.

---

## 2. Paleta

| Token | Hex | Uso |
|-------|-----|-----|
| `--cp-coral` | `#D6456A` | Primária, CTA, match |
| `--cp-coral-deep` | `#A82E4F` | Hover / ênfase |
| `--cp-coral-soft` | `#FCE8EE` | Chips, fundos de destaque |
| `--cp-teal` | `#2A9D8F` | Agente / IA / status “trabalhando” |
| `--cp-teal-deep` | `#1F756B` | Hover teal |
| `--cp-teal-soft` | `#E4F5F2` | Badge agente |
| `--cp-ink` | `#1A1520` | Texto |
| `--cp-muted` | `#6B6572` | Secundário |
| `--cp-line` | `#E4DFE6` | Bordas |
| `--cp-bg` | `#F6F5F8` | Fundo app |
| `--cp-white` | `#FFFFFF` | Superfície |
| `--cp-gold` | `#C4A35A` | Encontro / momento especial (sparing) |
| `--cp-err` | `#C62828` | Erro |

Gradiente de marca (splash/capa): `#A82E4F → #D6456A → #2A9D8F` (135°).

---

## 3. Tipografia

- **Display / títulos:** Sora (600–800)
- **UI / corpo:** Manrope (400–700)
- **Wordmark:** Sora ExtraBold; “Cup” ink + “ido” coral (ou wordmark monócromo ink)
- Títulos: tracking leve negativo; evitar caixa alta gritante em blocos longos

---

## 4. Logo (direção v1)

- **Wordmark:** `Cupido`
- **Símbolo:** arco mínimo / nó de conexão (dois arcos que se encontram) — **não** coração clássico, **não** cupido barroco
- Respiro = altura do “C”
- Mínimo digital: wordmark 120 px · símbolo 24 px
- Não esticar; não recolorir fora da paleta; não usar glow neon

Kit SVG/PNG: card **Criar logo Cupido** (board local).

---

## 5. Tom

Calmo, direto, um pouco íntimo. “Seu agente está conversando” > “Achamos seu crush!!!”. Evitar hype de swipe e jargão de IA (“LLM”, “embeddings”) na UI.

---

## 6. UI (protótipo)

- Mobile-first 390×844; alvos ≥ 44 px
- CTA único coral por tela; teal só para estados do **agente**
- Anônimo = avatar geométrico + label “Candidato ···”; revelado = foto + nome
- Sem cards decorativos no hero de marketing; no app, card só quando há ação

---

## 7. Antes → depois / rollback

Sem marca → tokens neste arquivo + manual HTML + protótipo alinhado.  
**Rollback:** `rm cupido/identidade-visual.md cupido/marca/identidade-visual-cupido-v1.html`
