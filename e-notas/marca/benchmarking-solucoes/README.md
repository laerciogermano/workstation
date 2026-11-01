# Benchmarking — soluções similares (notinhas.org)

Matriz vs **6 requisitos** do PRD: comparação, histórico, montagem apartada, vitrine da loja, busca geo, API empresas.

- **Card Trello:** https://trello.com/c/1fMjqGdR
- **PRD:** [`../../docs/prd.md`](../../docs/prd.md)
- **Entrada:** [`00-curadoria.html`](00-curadoria.html) / [`00-curadoria.pdf`](00-curadoria.pdf)
- **REQ:** [`../../docs/requisitos.md`](../../docs/requisitos.md) → REQ-014

## Matriz (resumo)

| Solução | Comp. | Hist. | Apartada | Vitrine | Geo/perto | API emp. |
|---------|-------|-------|----------|---------|-----------|----------|
| Busca Preço | Sim | Sim | Parcial | Parcial | Parcial | Não |
| Nota Preço | Sim | Sim | **Sim** | Não | Parcial | Não |
| Mercado Certo | Sim | Parcial | **Sim** | Não | **Sim** | Não |
| GoMarket | Sim | Sim | Não | **Sim** | **Sim** | Não |
| Qual o Preço | Sim | Parcial | Parcial | **Sim** | **Sim** | Não |
| PoupApp | Sim | Parcial | Não | Não | Parcial | Não |
| Nota Paraná | Sim | Parcial | Não | Não | **Sim** | Parcial |
| MP Brasil | Sim | Parcial | Não | Não | **Sim** | Não |
| Economiza AL | Sim | Parcial | Via 3º | Não | **Sim** | **API** |
| Quantto | Sim | Sim | N/A | N/A | Regional | **B2B** |

## Rollback

```bash
rm -rf e-notas/marca/benchmarking-solucoes
trello card:archive --id 6ae73d449d331353fd754807
```
