# Marca — notinhas.org / e-notas

## Identidade visual v1

Manual essencial (9 páginas A4 paisagem): capa, essência/tom, logo, versões, cores, tipografia, aplicações (app/splash/favicon), **redes sociais (exemplos de post)**, contracapa.

| Arquivo | Uso |
|---------|-----|
| [`identidade-visual-notinhas-v1.html`](identidade-visual-notinhas-v1.html) | Manual identidade print-ready (PDF depois) |
| [`../identidade-visual.md`](../identidade-visual.md) | Tokens e regras de marca |
| [`design-system-notinhas-v1.html`](design-system-notinhas-v1.html) | Design system v1 (tokens + componentes) |
| [`../design-system.md`](../design-system.md) | Tokens/componentes + mapa `app/` |
| [`referencias-identidade/README.md`](referencias-identidade/README.md) | Insumos Nota Paraná / Menor Preço |
| [`benchmarking-solucoes/README.md`](benchmarking-solucoes/README.md) | Concorrência |
| [`apresentacao-notinhas-v1.html`](apresentacao-notinhas-v1.html) | Apresentação (produto + benchmarking + DS) |
| [`apresentacao-notinhas-v1.md`](apresentacao-notinhas-v1.md) | Índice da apresentação |

**Cards:** [Criar identidade visual](https://trello.com/c/qUI3Rb9a) · [Criar design system](https://trello.com/c/qdH95gZX) · [Documento de apresentação](https://trello.com/c/hfGuzfMs) · tasks [`../tasks/6ae739e2ef0f49af2019c4f5/`](../tasks/6ae739e2ef0f49af2019c4f5/README.md) · [`../tasks/6ae739e3d95154fb9a7b51a6/`](../tasks/6ae739e3d95154fb9a7b51a6/README.md) · [`../tasks/6ae742a63b9ee278c2a0cc7e/`](../tasks/6ae742a63b9ee278c2a0cc7e/README.md)

**Antes → depois:** sem manual → identidade HTML v1 → DS HTML v1 → apresentação unificada `apresentacao-notinhas-v1.html`. PDF de marca e aplicação CSS no app ficam para passos seguintes.

### Gerar PDF (quando o escopo pedir)

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf=e-notas/marca/identidade-visual-notinhas-v1.pdf \
  "file://$(pwd)/e-notas/marca/identidade-visual-notinhas-v1.html"
```

### Rollback

```bash
rm -f e-notas/marca/identidade-visual-notinhas-v1.html \
      e-notas/marca/design-system-notinhas-v1.html \
      e-notas/marca/README.md \
      e-notas/identidade-visual.md \
      e-notas/design-system.md
rm -rf e-notas/tasks/6ae739e2ef0f49af2019c4f5 e-notas/tasks/6ae739e3d95154fb9a7b51a6
```
