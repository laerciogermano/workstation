# Task Trello: Melhorar scaneio de código de barras

- **Card ID:** `6ae90c796fe1cc9c667dd452`
- **URL:** https://trello.com/c/xdeWAy5y
- **Board:** [enotas](https://trello.com/b/6ae737d774f8555f2cf0fd96) · lista `Backlog`

## Objetivo

Deixar a leitura de EAN mais rápida e com maior taxa de sucesso (hoje demora e muitos códigos não pegam).

## Contexto

- Scanner atual: `Html5Qrcode` em `app/public/lista.js` (cadastro/edição de `codigos_barras`)
- Relato: latência alta; vários códigos não decodificam

## Rollback

```bash
rm -rf e-notas/tasks/6ae90c796fe1cc9c667dd452
trello card:archive --id 6ae90c796fe1cc9c667dd452
```
