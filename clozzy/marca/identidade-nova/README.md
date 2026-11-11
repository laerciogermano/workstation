# Clozzy 2028 — Identidade visual nova

Card: [Criar identidade visual (nova)](https://trello.com/c/ivTfpNhh) · board [Clozzy 2028](https://trello.com/b/n24j78NT/clozzy-2028).
Insumos: [as-is](../identidade-atual/README.md) (performer, site, Figma 289) · [benchmarking](../benchmarking-concorrentes/README.md) · método `core/definir-projeto-moderno/05-identidade-visual/`.

**Direção:** B “Círculo próximo” (C aberto + estrela) · Pink Clozzy #FF0065 · Gabarito + Figtree. Aguarda aprovação do checkpoint de logo.

| Arquivo | O que é |
|---|---|
| [`identidade-visual-clozzy-2028.pdf`](identidade-visual-clozzy-2028.pdf) | Manual com 14 páginas A4 paisagem |
| `identidade-visual-clozzy-2028.html` | Mesmo manual (self-contained) |
| [`BRAND.md`](BRAND.md) | One-pager |
| [`tokens.css`](tokens.css) | Tokens light/dark + motion |
| [`motion-guidelines.md`](motion-guidelines.md) | Assinatura “abrir o círculo” + reduced-motion |
| [`logos/`](logos/) | 20 masters SVG |
| [`export/`](export/) | PNG: app icons, favicon, avatar, mark, lockup |
| [`fonts/`](fonts/) | Gabarito + Figtree variáveis (OFL) |
| `_logos.py` · `_build.py` | Geradores |

## Gerar de novo

```bash
cd clozzy/marca/identidade-nova && python3 _build.py   # SVG + HTML + PDF + PNG (precisa fontTools, Pillow e Chrome)
```

## Rollback

```bash
rm -rf clozzy/marca/identidade-nova
```
