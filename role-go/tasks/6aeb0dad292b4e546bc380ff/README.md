# Task Trello: Protótipo Beta — PDF da galeria (E01·E02·E03)

- **Card ID:** `6aeb0dad292b4e546bc380ff`
- **URL:** https://trello.com/c/XIzwn6JC
- **Board:** [RoleGo](https://trello.com/b/Qe6mVdfL/rolego) · lista `done`

## Entrega

- HTML: [`../../beta-docs/prototipos/index.html`](../../beta-docs/prototipos/index.html)
- PDF (anexo no card): [`../../beta-docs/prototipos/prototipos-rolego-beta.pdf`](../../beta-docs/prototipos/prototipos-rolego-beta.pdf)
- Doc: [`../../beta-docs/12-prototipos.md`](../../beta-docs/12-prototipos.md)
- Publicado: https://rolego.com.br ([`../../deploy/README.md`](../../deploy/README.md))

## Regenerar PDF

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=25000 \
  --print-to-pdf=role-go/beta-docs/prototipos/prototipos-rolego-beta.pdf \
  "file://$(pwd)/role-go/beta-docs/prototipos/index.html"
```

## Rollback

```bash
rm -rf role-go/tasks/6aeb0dad292b4e546bc380ff
# card
trello card:archive --id 6aeb0dad292b4e546bc380ff
# site Contabo → SPA E01
# ver role-go/deploy/README.md (web-e01-vite-bak)
```
