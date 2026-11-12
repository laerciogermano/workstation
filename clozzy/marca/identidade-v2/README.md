# Clozzy — Identidade visual v2

Manual novo que junta todo o contexto: visão do produto, logo v1 (hml), prints favoritos (`../refs/`), rodadas de logo 1–8, paleta fechada (rosa, roxo, preto, branco + Pink Deep e cream), Gabarito + Figtree, referências de apps e telas-modelo. **Não substitui** [`../identidade-nova/`](../identidade-nova/README.md) (v1, Círculo próximo), que fica como histórico.

**Símbolo:** rodada 8 · “1 · Sutil · vão 5”, o C com a estrela original e a ponta · – ––.

| Arquivo | O que é |
|---|---|
| [`identidade-visual-clozzy-v2.pdf`](identidade-visual-clozzy-v2.pdf) · `.html` | Manual com 20 páginas A4 paisagem |
| [`BRAND.md`](BRAND.md) | One-pager |
| [`tokens.css`](tokens.css) | Tokens (cor, tipo, raios, motion, dark, reduced-motion) |
| [`logos/`](logos/) | 39 SVG: símbolo (8 cores + corte 16 px), lockups horizontal/vertical, wordmark, app icons, favicon, avatar |
| [`export/`](export/) | PNG: app 1024/512/180 · favicon 32/16 · avatar 800 · símbolo 512 · lockup 1200 |
| [`fonts/`](fonts/) | Gabarito + Figtree (OFL) |
| `_marca.py` · `_build.py` | Geradores |

```bash
cd clozzy/marca/identidade-v2 && python3 _marca.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/identidade-v2
```
