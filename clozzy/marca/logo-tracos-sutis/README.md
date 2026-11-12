# Clozzy — Traços sutis · variações (rodada 8)

Base: **2 · Traços sutis** da rodada 7 ([`../logo-c-tracos/`](../logo-c-tracos/README.md)): o C com a estrela original e a ponta `·  –  ––` → C, sempre com a mesma espessura (10). Pedido: **vãos maiores entre os traços**, de 3 para 5–7.

| Arquivo | O que é |
|---|---|
| [`tracos-sutis-variacoes-clozzy.pdf`](tracos-sutis-variacoes-clozzy.pdf) · `.html` | Documento com 10 páginas: origem, construção, 8 variações, comparação de vãos (3→7), 16 usos em cor, ícones e lockups, tela e animação, decisão |
| `svg/` | Por variação (`s1`…`s8`): cores, `-16`, apps (rosa/roxo/preto/branco), lockups e `-uso-<combinação>` |
| `_sutis.py` · `_build.py` | Geradores |

| # | Variação | Ponta (graus) · vão |
|---|---|---|
| **1** | **Sutil · vão 5** (recomendada) | · 20 30 · vão 5 |
| 2 | Sutil · vão 6 | · 20 30 · vão 6 |
| 3 | Sutil · vão 7 | · 20 30 · vão 7 |
| 4 | Traços mais longos | · 24 36 · vão 5 |
| 5 | Traços mais curtos | · 17 25 · vão 5 |
| 6 | Vão que abre na ponta | · 20 30 · vãos 7 / 5 |
| 7 | C mais aberto | · 20 30 · vão 5 · abertura +8° |
| 8 | Ponta de baixo | · 20 30 · vão 5 |

```bash
cd clozzy/marca/logo-tracos-sutis && python3 _sutis.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-tracos-sutis
```
