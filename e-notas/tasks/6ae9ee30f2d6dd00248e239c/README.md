# Task Trello: Escanear QR também por foto

- **Card ID:** `6ae9ee30f2d6dd00248e239c`
- **URL:** https://trello.com/c/vLJJBkPs
- **Board:** [enotas](https://trello.com/b/6ae737d774f8555f2cf0fd96) · lista `Backlog`

## Objetivo

Além do scan ao vivo, permitir tirar foto (ou escolher imagem) e decodificar o QR da nota a partir dela.

## Contexto

- Tela: `app/public/scan.html` (+ lógica em `app/public/app.js`)
- Hoje: só câmera contínua → URL → `POST /api/nota`
- Relacionado (EAN): [`../6ae90c796fe1cc9c667dd452/README.md`](../6ae90c796fe1cc9c667dd452/README.md) · [xdeWAy5y](https://trello.com/c/xdeWAy5y)

## Rollback

```bash
rm -rf e-notas/tasks/6ae9ee30f2d6dd00248e239c
trello card:archive --id 6ae9ee30f2d6dd00248e239c
```
