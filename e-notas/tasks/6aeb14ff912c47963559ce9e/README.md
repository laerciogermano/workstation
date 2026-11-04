# Task Trello: Buscar fotos ao cadastrar EAN

- **Card ID:** `6aeb14ff912c47963559ce9e`
- **URL:** https://trello.com/c/0fVZ8eBE
- **Board:** [enotas](https://trello.com/b/6ae737d774f8555f2cf0fd96) · lista `Backlog`

## Objetivo

Ao cadastrar/vincular um EAN, buscar automaticamente imagens candidatas (APIs de produto + fallback de busca), persistir em tabela por código de barras e permitir escolher a foto representativa do feed.

## Escopo (ainda não implementado)

Ver [`card-description.md`](card-description.md) e REQ-032 em [`../../docs/requisitos.md`](../../docs/requisitos.md).

## Rollback

```bash
trello card:move --id 6aeb14ff912c47963559ce9e --to Backlog --board enotas
# após implementação: DROP TABLE enotas.ean_imagens; reverter job/APIs/UI
```
