# RoleGo — Cores escolhidas

Documento simples com as **três cores escolhidas** para a marca.

| Cor | Hex |
|-----|-----|
| Ciano | `#68E2E3` |
| Roxo | `#6D34CC` |
| Rosa | `#CB4C7B` |

- [`cores-escolhidas-rolego.html`](cores-escolhidas-rolego.html) · [`cores-escolhidas-rolego.pdf`](cores-escolhidas-rolego.pdf)
- Amostras de origem: `ciano.png`, `roxo.png`, `rosa.png`

## Gerar PDF

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf=role-go/marca/cores-escolhidas/cores-escolhidas-rolego.pdf \
  "file://$(pwd)/role-go/marca/cores-escolhidas/cores-escolhidas-rolego.html"
```
