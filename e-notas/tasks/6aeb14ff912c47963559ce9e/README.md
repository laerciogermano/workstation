# Task Trello: Buscar fotos ao cadastrar EAN

- **Card ID:** `6aeb14ff912c47963559ce9e`
- **URL:** https://trello.com/c/0fVZ8eBE
- **Board:** [enotas](https://trello.com/b/6ae737d774f8555f2cf0fd96) · lista `Done`

## Objetivo

Ao cadastrar/vincular um EAN, buscar automaticamente imagens candidatas (APIs de produto + Google CSE opcional), persistir em `ean_imagens` e escolher a foto representativa do feed.

## Entrega

- `app/ean-imagens.js` — coleta OFF/OBF/OPF/UPCitemdb/(Google CSE) + download IPv4
- `app/db.js` — tabela `ean_imagens`, `buscarImagensEan`, `selecionarEanImagem`, enqueue no upsert
- `app/server.js` — `GET/POST /api/ean-imagens*`
- `app/public/lista.js` / `index.html` / `styles.css` — seção Fotos no detalhe
- REQ-032 · [`../../docs/requisitos.md`](../../docs/requisitos.md)
- Contabo: `/opt/e-notas/` + restart `enotas.service`

## Rollback

```bash
# código: git revert do commit desta entrega
# remoto: restaurar arquivos em /opt/e-notas/ + systemctl restart enotas
# SQL: DROP TABLE enotas.ean_imagens;
trello card:move --id 6aeb14ff912c47963559ce9e --to Backlog --board enotas
```
