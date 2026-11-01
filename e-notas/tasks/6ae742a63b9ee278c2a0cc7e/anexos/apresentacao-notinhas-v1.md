# Apresentação notinhas.shop v1

Documento único (produto + benchmarking + design system) para stakeholders.

| Artefato | Uso |
|----------|-----|
| [`apresentacao-notinhas-v1.html`](apresentacao-notinhas-v1.html) | Deck A4 paisagem print-ready (8 págs.) |
| Card | https://trello.com/c/hfGuzfMs |

## Conteúdo

1. **Produto** — problema, proposta, personas, capacidades, prioridade (síntese do PRD)
2. **Benchmarking** — matriz 6 requisitos + gaps/diferenciais
3. **Design system** — identidade (wordmark, paleta) + componentes UI v1

## Fontes

- [`../docs/prd.md`](../docs/prd.md)
- [`benchmarking-solucoes/README.md`](benchmarking-solucoes/README.md)
- [`identidade-visual-notinhas-v1.html`](identidade-visual-notinhas-v1.html) · [`../identidade-visual.md`](../identidade-visual.md)
- [`design-system-notinhas-v1.html`](design-system-notinhas-v1.html) · [`../design-system.md`](../design-system.md)

## PDF

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf=e-notas/marca/apresentacao-notinhas-v1.pdf \
  "file://$(pwd)/e-notas/marca/apresentacao-notinhas-v1.html"
```

## Rollback

```bash
rm -f e-notas/marca/apresentacao-notinhas-v1.html \
      e-notas/marca/apresentacao-notinhas-v1.md \
      e-notas/marca/apresentacao-notinhas-v1.pdf
# reabrir card se necessário: trello card:move --id 6ae742a63b9ee278c2a0cc7e --board enotas --list Backlog
```
