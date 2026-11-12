## Objetivo
PDF da galeria do protótipo navegável do Beta (E01 · E02 · E03) gerado a partir de `beta-docs/prototipos/index.html`.

## Publicado
https://rolego.com.br (`/opt/rolego/web` na Contabo)

## Entrega
- HTML: `role-go/beta-docs/prototipos/index.html`
- Doc: `role-go/beta-docs/12-prototipos.md`
- PDF anexo: `prototipos-rolego-beta.pdf` (A4 paisagem, ~21 págs.)
- Deploy: `role-go/deploy/README.md`

## Regenerar PDF
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=25000 \
  --print-to-pdf=role-go/beta-docs/prototipos/prototipos-rolego-beta.pdf \
  "file://$(pwd)/role-go/beta-docs/prototipos/index.html"
```