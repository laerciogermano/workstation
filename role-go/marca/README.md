# RoleGo — Marca

## Identidade visual v1

| Arquivo | Uso |
|---------|-----|
| [`identidade-visual-rolego-v1.html`](identidade-visual-rolego-v1.html) | Manual A4 paisagem (abrir no browser / imprimir PDF) |
| [`identidade-visual-rolego-v1.pdf`](identidade-visual-rolego-v1.pdf) | PDF gerado do HTML |
| [`identidade-visual-rolego-v1.zip`](identidade-visual-rolego-v1.zip) | Pacote HTML + PDF |

Tokens e regras: [`../identidade-visual.md`](../identidade-visual.md).

Molde de estrutura: [`../input/referencia-marca/README.md`](../input/referencia-marca/README.md).

Card Trello: https://trello.com/c/gU37I2lg (done).

## Gerar PDF de novo

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=role-go/marca/identidade-visual-rolego-v1.pdf \
  "file://$(pwd)/role-go/marca/identidade-visual-rolego-v1.html"
```

## Rollback

```bash
rm -rf role-go/marca
```
