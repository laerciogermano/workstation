# Benchmarking — concorrentes (Clozzy 2028)

Matriz vs plataformas de **conteúdo exclusivo / creator monetization** (BR + global), alinhada à visão Clozzy (*perfil → oferta → compra → biblioteca*).

- **Card Trello:** https://trello.com/c/RR95Cei7
- **Board:** [Clozzy 2028](https://trello.com/b/n24j78NT/clozzy-2028)
- **Visão:** [`../../README.md`](../../README.md)
- **Entrada:** [`00-curadoria.html`](00-curadoria.html) / [`00-curadoria.pdf`](00-curadoria.pdf)
- **Task:** [`../../tasks/6aeb158bc595d3438795932d/`](../../tasks/6aeb158bc595d3438795932d/README.md)

## Matriz (resumo)

| Plataforma | Foco | Taxa* | Assin. | PPV | Discovery | Pix | vs Clozzy |
|------------|------|-------|--------|-----|-----------|-----|-----------|
| Privacy | BR adulto | 20% | Sim | Sim | Marca local | **Sim** | Ref. BR; gap em “pack=produto” |
| CloseFans | BR + Telegram | 20%+fixo | Sim | Sim | Fraco | Sim | Site-first / tarifa fixa |
| FatalFans | BR | ~15% | Sim | Sim | Fraco | Sim | Escala |
| FanFever | BR multi-nicho | ~10%** | Sim | Sim | Fraco | Sim | Liquidez |
| OnlyFans | Global | 20% | Sim | Sim | Quase zero*** | Não | Pix + vitrine clara |
| Fansly | Global | 20% | Sim | Sim | **Search+FY** | Não | Rails BR |
| Fanvue | Global+AI | 20% | Sim | Sim | Discover | Não | Pix / hold saque |
| LoyalFans | Adult+live | 20% | Sim | Store | Parcial | Não | Pix |
| JustForFans | Adult-first | 20/85%**** | Multi | Store | Search | Não | Foco influencer BR |
| FanCentro | Social privado | 20% | Sim | Clips | Fraco | Não | UX moderna + Pix |
| Patreon | Membership | 10%+***** | Tiers | Parc. | Parcial | Não | Adult explícito |
| Passes | PG-13 | ~10–20% | Sim | Sim | Parcial | Não | Adult + BR |
| **Clozzy 2028** | Exclusivo influencer | A def. | Alvo | Pack=SKU | Evol. | **Alvo** | Vitrine→compra→acesso |

\*Creator keep típico ~80% salvo nota. \*\*Divulgado pela empresa. \*\*\*Categorias OF 2026 ainda fracas p/ adulto. \*\*\*\*Programa exclusive. \*\*\*\*\*Páginas novas pós-2025-08.

## Insights p/ identidade visual

- Mercado: dark + ciano/rosa/roxo; OF = azul utilitário; Privacy = verde BR.
- **Oportunidade:** não clonar OF nem cair no cluster roxo-on-black — exclusivo como produto de vitrine (clareza/confiança).

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
# ou
rm -rf clozzy/marca/benchmarking-concorrentes
```
