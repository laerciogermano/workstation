# Task Trello: Vendedores v3-cmp (fotos v1)

- **Card:** [Vendedores v3-cmp: PDF com fotos da v1 (comparação vs Unsplash)](https://trello.com/c/J1p8LQef)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9d6b1af135d58a5e42918`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

PDF paralelo da v3 com fotos da v1 — só comparação visual vs Unsplash.

## Entrega

| Artefato | Caminho |
|---|---|
| PDF cmp | [`reports/Vendedores-v3-cmp-fotos-v1.pdf`](reports/Vendedores-v3-cmp-fotos-v1.pdf) |
| MD | [`vendedores-v3-cmp.md`](vendedores-v3-cmp.md) |
| Snapshot CSV/Experience (v3) | [`vendedores.csv`](vendedores.csv) · [`experiencia-por-vendedor.csv`](experiencia-por-vendedor.csv) |
| Fotos v1 | [`avatars/`](avatars/) |

**Antes → depois:** v3 Unsplash → este PDF usa TPDNE v1. Documento **não vigente**. Rollback: usar v3 em [`../6ae9d41cca30d13ffbba775f/README.md`](../6ae9d41cca30d13ffbba775f/README.md).

## Relacionados

- v3: [`../6ae9d41cca30d13ffbba775f/README.md`](../6ae9d41cca30d13ffbba775f/README.md) · [phrqBZpX](https://trello.com/c/phrqBZpX)
- Fotos v1: [`../6ae9ca1e215a10fb339d26e4/README.md`](../6ae9ca1e215a10fb339d26e4/README.md) · [1KXbnbBZ](https://trello.com/c/1KXbnbBZ)
- Unsplash: [`../6ae9d26ed00b21d127e73012/README.md`](../6ae9d26ed00b21d127e73012/README.md)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9d6b1af135d58a5e42918
trello card:archive --id 6ae9d6b1af135d58a5e42918
```
