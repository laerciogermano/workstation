# Benchmarking — concorrentes (Clozzy 2028)

Matriz vs plataformas de **conteúdo exclusivo / creator monetization**, ordenada do **mais importante ao menos importante** (escala: receita / GMV / MAU / visitas).

- **Card Trello:** https://trello.com/c/RR95Cei7
- **Board:** [Clozzy 2028](https://trello.com/b/n24j78NT/clozzy-2028)
- **Visão:** [`../../README.md`](../../README.md)
- **Código Clozzy (clones):** [`clozzy/`](clozzy/README.md) · **identidade as-is:** [`../identidade-atual/`](../identidade-atual/README.md)
- **Entrada:** [`00-curadoria.html`](00-curadoria.html) / [`00-curadoria.pdf`](00-curadoria.pdf)
- **Task:** [`../../tasks/6aeb158bc595d3438795932d/`](../../tasks/6aeb158bc595d3438795932d/README.md)

## Relatório compilado

Documento único claro (estilo cloud / IBM Plex) com matriz de funcionalidades + **todas** as prints:

- [`relatorio-compilado.html`](relatorio-compilado.html) — versionado
- `relatorio-compilado.pdf` — **local** (Chrome print; ~200MB+, fora do git)
- Gerador: [`build-relatorio-compilado.mjs`](build-relatorio-compilado.mjs)

```bash
node clozzy/marca/benchmarking-concorrentes/build-relatorio-compilado.mjs
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=120000 \
  --print-to-pdf=clozzy/marca/benchmarking-concorrentes/relatorio-compilado.pdf \
  "file://$(pwd)/clozzy/marca/benchmarking-concorrentes/relatorio-compilado.html"
```

Cobre Privacy · CloseFans · FatalFans · Fansly. Antes → depois: só curadorias por pasta → um HTML compilado. Rollback: apagar `relatorio-compilado.*` + `build-relatorio-compilado.mjs`.

## Ordem (mais → menos)

| # | Plataforma | Escala (âncora) | Taxa* | Pix | vs Clozzy |
|---|------------|-----------------|-------|-----|-----------|
| 1 | **OnlyFans** | ~US$1,6B receita · ~378M visitas/mês | 20% | Não | Pix + pack=produto |
| 2 | **Patreon** | ~US$2B+/ano aos creators · ~136M visitas | 10%+ | Não | Adult; vitrine sexy |
| 3 | **Privacy** | #1 BR · ~12,6M visitas | 20% | **Sim** | Pack=produto |
| 4 | **Fansly** | ~37–39M visitas · ~130M regs | 20% | Não | Rails BR |
| 5 | **Fanvue** | &gt;US$200M ARR · ~17M MAU | 20% | Não | Pix / hold |
| 6 | **LoyalFans** | ~8–9M visitas | 20% | Não | Pix |
| 7 | **FanCentro** | ~3,9M visitas | 20% | Não | UX + Pix |
| 8 | **JustForFans** | ~3M visitas | 20/85% | Não | Foco BR |
| 9 | **Passes** | ~2,5M visitas | ~10–20% | Não | Adult + BR |
| 10 | **CloseFans** | BR · &gt;1M MAU (alega) | 20%+fixo | Sim | Catálogo site |
| 11 | **FatalFans** | BR menor | ~15% | Sim | Escala |
| 12 | **FanFever** | ~141k visitas | ~10% | Sim | Liquidez |
| — | **Clozzy 2028** | Entrante | A def. | **Alvo** | Vitrine→compra→acesso |

\*Creator keep típico ~80% salvo nota. Âncoras públicas 2025–2026 (não auditadas).

## IA — o que fazem / prometem (resumo)

| # | Plataforma | Política | Conta 100% IA | Tools nativos | Chat/auto fãs | Promessa |
|---|------------|----------|---------------|---------------|---------------|----------|
| 1 | OnlyFans | IA do criador verificado + label | Não | Sem suite | Opaco | Enhancement com transparência |
| 2 | Patreon | Adult: ilustrado ok; hiper-realista c/ consent | Arte ok; sexbot ban | Sem chatbot core | Ban companion adult | IA = mídia, não relacionamento |
| 3 | Privacy | A confirmar | Inspecionar | Sem suite anunciada | Inspecionar | Gap doc vs Fanvue |
| 4 | Fansly | Ban fotorealista (label não libera) | Não | Sem product | Ban sem humano | “Conteúdo humano real” |
| 5 | **Fanvue** | Aberta + disclosure | **Sim** | **Messaging, Chatbot, Agent, voice, Insights** | **Sim** | Escalar chat/conteúdo com IA |
| 6 | LoyalFans | Ban fotorealista (AUP) | Não | Sem suite | Ban sem humano | Humano + live |
| 10 | CloseFans | A confirmar | Inspecionar | Sem suite anunciada | Inspecionar | Telegram-first; IA não é pitch |

Detalhe + implicações Clozzy: §5 de [`00-curadoria.html`](00-curadoria.html).

## Cards filhos — inspeção profunda

Cadastro + prints de todas as telas + inventário de funcionalidades (Clozzy 2028):

| # | Plataforma | Card | Status |
|---|------------|------|--------|
| 1 | OnlyFans | https://trello.com/c/5SHmEwEZ | Backlog — **fora da fila atual** |
| 2 | Patreon | https://trello.com/c/nTY47jqR | Backlog |
| 3 | Privacy | https://trello.com/c/vFDqfcKE | Feito (2026-11-09) |
| 4 | Fansly | https://trello.com/c/HxwNb1E7 | **Feito (2026-11-10)** |
| 5 | Fanvue | https://trello.com/c/3TA3RKF5 | Priorizados |
| 6 | LoyalFans | https://trello.com/c/iBZZX5G0 | Priorizados |
| 10 | CloseFans | https://trello.com/c/JFzUjNaW | Feito (2026-11-10) |
| 11 | FatalFans | — | Feito (2026-11-10) |

**Fila atual (2026-11-10):** Fanvue → LoyalFans. Fansly feito. OnlyFans fora.

Entrega esperada por card: `clozzy/marca/benchmarking-concorrentes/<plataforma>/` (`prints/` + `funcionalidades.md` + `ia.md` + `README.md`).

**Privacy (2026-11-09):** pasta [`privacy/`](privacy/README.md) — CDP `benchmarking` :9263; cadastro fan `benchclozzy342` + prints desktop/mobile + inventário. Documento: [`privacy/benchmarking-privacy.html`](privacy/benchmarking-privacy.html) / [`.pdf`](privacy/benchmarking-privacy.pdf).

**CloseFans (2026-11-10):** pasta [`closefans/`](closefans/README.md) — CDP `closefans` :9264; fan `closefans.bench@brsupply.email` logado + Descobrir/lista + público. Documento: [`closefans/benchmarking-closefans.html`](closefans/benchmarking-closefans.html) / [`.pdf`](closefans/benchmarking-closefans.pdf).

**Fansly (2026-11-10):** pasta [`fansly/`](fansly/README.md) — CDP `fansly` :9266; fan `fansly.bench@brsupply.email` / `FanslyBench26` (e-mail NOT VERIFIED nesta sessão). Documento: [`fansly/benchmarking-fansly.html`](fansly/benchmarking-fansly.html) / [`.pdf`](fansly/benchmarking-fansly.pdf).

**FatalFans (2026-11-10):** pasta [`fatalfans/`](fatalfans/README.md) — CDP `fatalfans` :9265; fan `fatalfans.bench@brsupply.email` / `FatalfansBench` + público. Documento: [`fatalfans/benchmarking-fatalfans.html`](fatalfans/benchmarking-fatalfans.html) / [`.pdf`](fatalfans/benchmarking-fatalfans.pdf).

## Insights p/ identidade visual

- Mercado: dark + ciano/rosa/roxo; OF = azul utilitário; Privacy = verde BR; Patreon = coral membership.
- **Oportunidade:** não clonar OF nem cair no cluster roxo-on-black — exclusivo como produto de vitrine.

## Gerar PDF

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf=clozzy/marca/benchmarking-concorrentes/00-curadoria.pdf \
  "file://$(pwd)/clozzy/marca/benchmarking-concorrentes/00-curadoria.html"
```

## Rollback

```bash
git checkout -- clozzy/marca/benchmarking-concorrentes
```
