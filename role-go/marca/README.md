# RoleGo — Marca

## Identidade visual v1

Manual **essencial** (6 páginas A4 paisagem): capa, logo, versões, cores, tipografia e aplicações básicas. Tokens alinhados à [colagem de marca](../input/referencia-marca-rolego-colagem-2026-10-31.jpeg).

| Arquivo | Uso |
|---------|-----|
| [`identidade-visual-rolego-v1.html`](identidade-visual-rolego-v1.html) | Manual (browser / print PDF) |
| [`identidade-visual-rolego-v1.pdf`](identidade-visual-rolego-v1.pdf) | PDF gerado do HTML |
| [`identidade-visual-rolego-v1.zip`](identidade-visual-rolego-v1.zip) | Pacote HTML + PDF |

Tokens: [`../identidade-visual.md`](../identidade-visual.md) · card Trello (done): https://trello.com/c/gU37I2lg · card logo: https://trello.com/c/S7jWwUbC

**Antes → depois (2026-10-31):** manual longo (16 págs., gradiente ciano/violeta, pin no “o”, Poppins no wordmark) → manual enxuto com lima→magenta, pin no “e”, Bodoni no logo. Rollback: restaurar commit anterior + reanexar PDF antigo no card.

O wordmark é montado por script (`buildLogos`): Bodoni + gradiente + pin SVG acima do “e”.

## Gerar PDF de novo

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=12000 \
  --print-to-pdf=role-go/marca/identidade-visual-rolego-v1.pdf \
  "file://$(pwd)/role-go/marca/identidade-visual-rolego-v1.html"
```

Depois:

```bash
cd role-go/marca && zip -j identidade-visual-rolego-v1.zip \
  identidade-visual-rolego-v1.html identidade-visual-rolego-v1.pdf
```

## Rollback

```bash
git checkout HEAD~1 -- role-go/marca role-go/identidade-visual.md
```
