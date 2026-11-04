# Marca — Cupido

| Arquivo | Uso |
|---------|-----|
| [`../identidade-visual.md`](../identidade-visual.md) | Tokens e regras |
| [`identidade-visual-cupido-v1.html`](identidade-visual-cupido-v1.html) | Manual identidade print-ready |
| [`benchmarking-concorrentes/`](benchmarking-concorrentes/README.md) | Dating / wingman / blind match |

**Board local:** [`../../Trello/Cupido/`](../../Trello/Cupido/)

**Antes → depois:** sem marca → tokens + manual HTML + benchmarking.  
**Próximo:** card Criar logo (kit SVG/PNG).

## Gerar PDF

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf=cupido/marca/identidade-visual-cupido-v1.pdf \
  "file://$(pwd)/cupido/marca/identidade-visual-cupido-v1.html"
```

## Rollback

```bash
rm -rf cupido/marca cupido/identidade-visual.md
```
