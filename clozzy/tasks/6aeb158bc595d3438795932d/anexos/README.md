# Benchmarking — concorrentes (Clozzy 2028)

Matriz vs plataformas de **conteúdo exclusivo / creator monetization**, ordenada do **mais importante ao menos importante** (escala: receita / GMV / MAU / visitas).

- **Card Trello:** https://trello.com/c/RR95Cei7
- **Board:** [Clozzy 2028](https://trello.com/b/n24j78NT/clozzy-2028)
- **Visão:** [`../../README.md`](../../README.md)
- **Entrada:** [`00-curadoria.html`](00-curadoria.html) / [`00-curadoria.pdf`](00-curadoria.pdf)
- **Task:** [`../../tasks/6aeb158bc595d3438795932d/`](../../tasks/6aeb158bc595d3438795932d/README.md)

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

## Cards filhos — inspeção profunda

Cadastro + prints de todas as telas + inventário de funcionalidades (Backlog Clozzy 2028):

| # | Plataforma | Card |
|---|------------|------|
| 1 | OnlyFans | https://trello.com/c/5SHmEwEZ |
| 2 | Patreon | https://trello.com/c/nTY47jqR |
| 3 | Privacy | https://trello.com/c/vFDqfcKE |
| 4 | Fansly | https://trello.com/c/HxwNb1E7 |
| 5 | Fanvue | https://trello.com/c/3TA3RKF5 |
| 6 | LoyalFans | https://trello.com/c/iBZZX5G0 |
| 10 | CloseFans | https://trello.com/c/JFzUjNaW |

Entrega esperada por card: `clozzy/marca/benchmarking-concorrentes/<plataforma>/` (`prints/` + `funcionalidades.md` + `README.md`).

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
