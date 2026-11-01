# notinhas.org — Design system v1

Tokens e componentes de UI a partir da [identidade visual](identidade-visual.md). Manual print-ready: [`marca/design-system-notinhas-v1.html`](marca/design-system-notinhas-v1.html) · card [Criar design system](https://trello.com/c/qdH95gZX).

**Base:** identidade v1 (azul `#0069B4` + verde `#00984B`).  
**Escopo v1:** só o necessário para scan QR, busca EAN/nome, lista de preços/lojas e cadastros admin.

---

## 1. Tokens

Herdar cores/tipo da identidade (`--nt-*`). Complementos de layout:

| Token | Valor | Uso |
|-------|-------|-----|
| `--nt-space-1` … `--nt-space-6` | 4 / 8 / 12 / 16 / 24 / 32 px | Espaçamento |
| `--nt-radius-sm` | `8px` | Inputs, chips internos |
| `--nt-radius` | `14px` | Cards, painéis |
| `--nt-pill` | `999px` | Botões, chips |
| `--nt-shadow` | `0 1px 2px rgba(11,31,51,.06), 0 8px 24px rgba(11,31,51,.06)` | Card de destaque |
| `--nt-err-soft` | `#FDECEC` | Fundo erro |
| `--nt-warn` / `--nt-warn-soft` | `#D97706` / `#FEF3C7` | Sem EAN / atenção |

Controles: altura **40 px** (sm 32 / lg 48). Fundo app `#F5F7FA`, superfície `#FFFFFF`.

---

## 2. Componentes

| Componente | Regra |
|------------|--------|
| **Button** | `pri` azul · `sec` outline azul · `ok` verde (menor preço) · `ghost` · `danger` |
| **Chip** | `menor` verde · data/filtro azul · `sem EAN` warn · erro vermelho |
| **Search** | Campo único EAN/nome; focus ring azul |
| **Input** | Borda `--nt-line`; erro com `--nt-err` + hint |
| **Price card** | Preço mínimo verde + chip `menor` + loja · data · distância opcional |
| **List item** | Ocorrências sem sombra; preço tabular |
| **Nav / tabs** | Ativo em azul profundo; tabs com underline |
| **Table** | Header mist; mono em EAN/chave |
| **Empty / error / loading** | Estado com CTA único |
| **Scan** | Viewport escuro + frame verde-claro; status textual |

---

## 3. Mapeamento `e-notas/app`

Aplicado em `app/public/styles.css` + wordmark nas páginas (2026-11-01):

| Antes | Depois |
|-------|--------|
| Dark `#0f1419` / `#1a222c` | Light `--nt-bg` / `--nt-white` |
| `.btn` `#4a90d9` | `--nt-blue` `#0069B4` · pill |
| `.status.ok` / `.err` | `--nt-green-deep` / `--nt-err` |
| `.search` / `.form-ean` | inputs light + focus ring azul |
| `table` / `.tabs` / `.modal` | header mist, tabs underline, modal branco |
| Título “e-notas” | wordmark **notinhas.org** (`.brand`) |
| Scan `#reader` | viewport `--nt-ink` (exceção DS) |

**Rollback UI:** `git checkout HEAD~1 -- e-notas/app/public/` (ou restore dos arquivos anteriores ao commit de tema).

---

## 4. Rollback

```bash
rm -f e-notas/design-system.md \
      e-notas/marca/design-system-notinhas-v1.html
rm -rf e-notas/tasks/6ae739e3d95154fb9a7b51a6
```
