# Board — Design system v1

Tokens e componentes da UI kanban. Visão: [`../README.md`](../README.md) · PRD: [`prd.md`](prd.md).

**Direção:** canvas claro frio, tinta quase-navy, **um** acento teal (`#0D9488`), tipografia Sora + IBM Plex Sans. Sem tema roxo, sem dark-default, sem cream/terracota.

**Refs de disciplina (não copiar look):** estrutura de tokens de [`../../core/shadcn-design/README.md`](../../core/shadcn-design/README.md) — Board tem identidade própria.

---

## 1. Princípios de UI

1. **O board é o herói** — 1ª viewport = quadro kanban (listas + cards), não dashboard de métricas.
2. **Card = unidade de interação** — sombra/borda só o necessário para leitura e drag; sem card-decoration no chrome.
3. **Uma cor de marca** — teal só em CTA, foco e brand mark; labels usam paleta semântica separada.
4. **Densidade útil** — listas estreitas o bastante para 3–5 colunas no desktop; cards compactos com título + chips.
5. **Motion curto** — drag do card (lift 120ms), snap na soltura; sem confetti.

---

## 2. Tokens — cor

| Token | Valor | Uso |
|-------|-------|-----|
| `--bd-canvas` | `#E8EEF2` | Fundo da app / área do board |
| `--bd-surface` | `#FFFFFF` | Lista, modal, header |
| `--bd-surface-muted` | `#F3F6F8` | Card idle, inputs |
| `--bd-ink` | `#0C1222` | Texto primário |
| `--bd-ink-muted` | `#5B6577` | Secundário |
| `--bd-ink-subtle` | `#8B95A5` | Meta (due, contagem) |
| `--bd-line` | `#D5DCE4` | Hairline |
| `--bd-line-strong` | `#B8C2CE` | Hover borda |
| `--bd-accent` | `#0D9488` | Brand / CTA / focus |
| `--bd-accent-hover` | `#0F766E` | CTA hover |
| `--bd-on-accent` | `#FFFFFF` | Texto sobre accent |
| `--bd-danger` | `#C23B3B` | Destrutivo |
| `--bd-warn` | `#C47A00` | Due próximo |
| `--bd-late` | `#C23B3B` | Due atrasado |
| `--bd-ok` | `#1B7F4A` | Checklist completo / ok |

### Labels (catálogo default)

| Nome | Hex |
|------|-----|
| verde | `#22A06B` |
| amarelo | `#E2B203` |
| laranja | `#F18F01` |
| vermelho | `#E2483D` |
| azul | `#388BFF` |
| teal | `#0D9488` |
| cinza | `#8590A2` |

---

## 3. Tokens — tipografia

| Token | Família | Size / weight / leading |
|-------|---------|-------------------------|
| `--bd-font-ui` | `"Sora", "Segoe UI", sans-serif` | UI / títulos de board |
| `--bd-font-body` | `"IBM Plex Sans", "Segoe UI", sans-serif` | Descrição, comentários |
| `--bd-font-mono` | `"IBM Plex Mono", ui-monospace, monospace` | IDs, atalhos |
| Display board | Sora 600 | 22px / 1.2 / -0.02em |
| Lista título | Sora 600 | 14px / 1.3 |
| Card título | IBM Plex Sans 500 | 14px / 1.35 |
| Body | IBM Plex Sans 400 | 14px / 1.5 |
| Meta | IBM Plex Sans 400 | 12px / 1.4 · `--bd-ink-subtle` |

Carregar Sora + IBM Plex via fonte self-host ou Google Fonts no `web` (quando existir).

---

## 4. Tokens — espaço, raio, sombra

| Token | Valor |
|-------|-------|
| `--bd-space-1` … `--bd-space-6` | 4 / 8 / 12 / 16 / 24 / 32 px |
| `--bd-radius-sm` | `6px` |
| `--bd-radius` | `10px` |
| `--bd-radius-lg` | `14px` |
| `--bd-shadow-card` | `0 1px 2px rgba(12,18,34,.06)` |
| `--bd-shadow-drag` | `0 8px 24px rgba(12,18,34,.14)` |
| `--bd-list-width` | `272px` |
| Controle altura | 36 px (sm 32 / lg 40) |

---

## 5. Componentes

| Componente | Regra |
|------------|--------|
| **App shell** | Top bar `--bd-surface` + hairline; brand **Board** à esquerda; lista de boards / avatar à direita |
| **Board canvas** | Fundo `--bd-canvas`; scroll horizontal das listas; padding `--bd-space-4` |
| **List** | Coluna `--bd-surface`, radius `--bd-radius-lg`, header sticky com título + menu; botão “+ card” no rodapé |
| **Card** | `--bd-surface-muted` → white no hover; `--bd-shadow-card`; ao drag: `--bd-shadow-drag` + scale 1.02 |
| **Card modal** | Overlay 40% ink; painel `--bd-surface` max 720px; seções Descrição / Checklist / Comentários |
| **Label chip** | Pill 8px radius interno, texto ink ou white conforme contraste; max 3 chips no card (+N) |
| **Due badge** | Meta 12px; warn/late conforme prazo |
| **Checklist progress** | Barra fina accent / ok quando 100% |
| **Button** | `pri` accent · `sec` outline line · `ghost` · `danger` |
| **Input / textarea** | Borda `--bd-line`; focus ring 2px accent 40% |
| **Filter bar** | Chips de label + campo busca no topo do board |
| **Empty** | Uma frase + um CTA (“Criar board” / “Adicionar card”) |
| **Archive drawer** | Lateral direita; lista de arquivados + restaurar |

### Não usar (v1)

- Cards no hero de marketing (não há landing marketing no MVP)
- Pills decorativas / stat strips no board
- Gradiente roxo / glow / multi-shadow
- Ícones emoji como substituto de UI

---

## 6. Motion

| Evento | Duração / easing |
|--------|------------------|
| Card lift (drag start) | 120ms ease-out |
| Card drop | 160ms ease-in-out |
| Modal open | 180ms fade+translateY(8px) |
| Toast | 200ms |

---

## 7. Layout do board (desktop)

```text
┌─ top bar: Board · [boards ▾] · busca · avatar ─────────────┐
│ filters: [labels] [due] [q________]                         │
│ ┌ lista ┐ ┌ lista ┐ ┌ lista ┐ ┌ lista ┐  [+ lista]         │
│ │ cards │ │ cards │ │ cards │ │ cards │                    │
│ └───────┘ └───────┘ └───────┘ └───────┘                    │
└─────────────────────────────────────────────────────────────┘
```

Mobile: listas em scroll horizontal; modal full-screen.

---

## 8. Acessibilidade

- Contraste texto/fundo AA em ink sobre canvas/surface.
- Focus visível (ring accent) em todos os controles.
- Drag com alternativa: menu “Mover para…” no card.
- Labels não só por cor: nome no chip / tooltip.

---

## 9. Rollback

```bash
# só este doc nesta fase
git checkout HEAD -- board/docs/design-system.md
# ou
rm board/docs/design-system.md
```

## Próximos passos

→ Aplicar tokens no scaffold `web/` · protótipo HTML opcional em `docs/prototype.html`
