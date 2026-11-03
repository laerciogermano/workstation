# Task Trello: Escanear QR também por foto

- **Card ID:** `6ae9ee30f2d6dd00248e239c`
- **URL:** https://trello.com/c/vLJJBkPs
- **Board:** [enotas](https://trello.com/b/6ae737d774f8555f2cf0fd96) · lista `Done`

## Objetivo

Além do scan ao vivo, permitir tirar foto (ou escolher imagem) e decodificar o QR da nota a partir dela.

## Entrega

- `app/public/scan.html` — botões Tirar foto / Escolher imagem + file inputs
- `app/public/app.js` — `scanFile` + reinício da câmera se falhar
- `app/public/styles.css` — `.scan-alt` / `.btn-ghost`
- REQ-030 em [`../../docs/requisitos.md`](../../docs/requisitos.md)
- Contabo: `/opt/e-notas/public/` (`scan.html`, `app.js`, `styles.css`)

## Rollback

```bash
# código: git revert do commit desta entrega
# remoto:
#   restaurar scan.html app.js styles.css anteriores em /opt/e-notas/public/
trello card:move --id 6ae9ee30f2d6dd00248e239c --to Backlog --board enotas
```
