# Marca — notinhas.org / e-notas

## Identidade visual v1

Manual essencial (9 páginas A4 paisagem): capa, essência/tom, logo, versões, cores, tipografia, aplicações (app/splash/favicon), **redes sociais (exemplos de post)**, contracapa.

| Arquivo | Uso |
|---------|-----|
| [`identidade-visual-notinhas-v1.html`](identidade-visual-notinhas-v1.html) | Manual print-ready (PDF depois) |
| [`../identidade-visual.md`](../identidade-visual.md) | Tokens e regras |
| [`referencias-identidade/README.md`](referencias-identidade/README.md) | Insumos Nota Paraná / Menor Preço |
| [`benchmarking-solucoes/README.md`](benchmarking-solucoes/README.md) | Concorrência |

**Card:** [Criar identidade visual](https://trello.com/c/qUI3Rb9a) · task [`../tasks/6ae739e2ef0f49af2019c4f5/`](../tasks/6ae739e2ef0f49af2019c4f5/README.md)

**Apresentação (produto + benchmarking + DS):** [card](https://trello.com/c/hfGuzfMs) · task [`../tasks/6ae742a63b9ee278c2a0cc7e/`](../tasks/6ae742a63b9ee278c2a0cc7e/README.md) — identidade v1 anexada; documento unificado pendente.

**Antes → depois:** sem manual → HTML v1 (azul `#0069B4` + verde `#00984B`, wordmark `notinhas.org`). PDF e design system ficam para cards seguintes.

### Gerar PDF (quando o escopo pedir)

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf=e-notas/marca/identidade-visual-notinhas-v1.pdf \
  "file://$(pwd)/e-notas/marca/identidade-visual-notinhas-v1.html"
```

### Rollback

```bash
rm -f e-notas/marca/identidade-visual-notinhas-v1.html e-notas/marca/README.md e-notas/identidade-visual.md
rm -rf e-notas/tasks/6ae739e2ef0f49af2019c4f5
```
