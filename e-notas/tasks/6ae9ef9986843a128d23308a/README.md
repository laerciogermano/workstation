# Task Trello: EAN na vitrine da loja

- **Card ID:** `6ae9ef9986843a128d23308a`
- **URL:** https://trello.com/c/JllifNBV
- **Board:** [enotas](https://trello.com/b/6ae737d774f8555f2cf0fd96) · lista `Done`

## Objetivo

No item da vitrine do estabelecimento: botão de leitor de código de barras (câmera, foto/imagem e digitação) para vincular EAN ao produto da loja.

## Entrega

- `app/public/lista.js` — botão na vitrine + `decodeEanFromFile` + handlers
- `app/public/index.html` — Tirar foto / Escolher imagem no modal EAN
- `app/public/styles.css` — `.produto-card-loja` / `.produto-card-hit` / `.btn-ean`
- REQ-031 em [`../../docs/requisitos.md`](../../docs/requisitos.md)
- Contabo: `/opt/e-notas/public/` (`lista.js`, `index.html`, `styles.css`)

## Rollback

```bash
# código: git revert do commit desta entrega
# remoto: restaurar lista.js index.html styles.css anteriores em /opt/e-notas/public/
trello card:move --id 6ae9ef9986843a128d23308a --to Backlog
```
