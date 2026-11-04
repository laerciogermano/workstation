# Task Trello: Notinhas Beta — pacote de documentação + protótipos

- **Card ID:** `6aeb15499b331fc5cfe8a447`
- **URL:** https://trello.com/c/jhxFUqLz
- **Board:** [enotas](https://trello.com/b/6ae737d774f8555f2cf0fd96) · lista `Done`
- **Descrição:** [`card-description.md`](card-description.md)

## Entrega

- Pacote: [`../../beta-docs/README.md`](../../beta-docs/README.md)
- Protótipos: [`../../beta-docs/prototipos/index.html`](../../beta-docs/prototipos/index.html)
- PDF (anexo no card): [`../../beta-docs/prototipos/prototipos-notinhas-beta.pdf`](../../beta-docs/prototipos/prototipos-notinhas-beta.pdf)
- Doc inventário: [`../../beta-docs/12-prototipos.md`](../../beta-docs/12-prototipos.md)

## Regenerar PDF

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=25000 \
  --print-to-pdf=e-notas/beta-docs/prototipos/prototipos-notinhas-beta.pdf \
  "file://$(pwd)/e-notas/beta-docs/prototipos/index.html"
```

## Rollback

```bash
rm -rf e-notas/beta-docs
# card
trello card:archive --id 6aeb15499b331fc5cfe8a447
```
