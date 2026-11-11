# Clozzy — Possibilidades de logo (rodada 4: anel tracejado)

Base: prints favoritos em [`../refs/`](../refs/), logo v1 do hml, rodadas 1–3 e [`../referencias-apps/`](../referencias-apps/README.md).
**Regras:** anel **tracejado e mais grosso** (24/256; corte ≤ 24 px com 34) · estrela arredondada menor · só Pink Clozzy, Pink Deep, Roxo v1 #7C48C4, Ink, Cream, Branco · Gabarito 800.

| Arquivo | O que é |
|---|---|
| [`circulo-tracejado/`](circulo-tracejado/README.md) | **Rodada 5** — estrela original + anel fino tracejado à direita, Pink Deep (6 variações) |
| [`possibilidades-logo-clozzy.pdf`](possibilidades-logo-clozzy.pdf) | Documento com 16 páginas: prints, contexto, anatomia, espessura, 12 possibilidades, wordmark, teste de 16 px, aplicação, recomendação |
| `possibilidades-logo-clozzy.html` | Mesmo documento (self-contained) |
| `svg/` | Para cada conceito: `-color`, `-dark`, `-tile`, `-mono`, `-16`, `-16-dark`, `-app-pink`, `-app-ink`, `-lockup`, `-lockup-dark`. Mais o wordmark `13-o-story-*` |
| `_marcas.py` · `_build.py` | Geradores |

| # | Possibilidade | Prints |
|---|---|---|
| 00a · 00b | Disco rosa (v1) · Círculo próximo (pontos de partida) | 1·3 · 5·9 |
| **01** | **5 pontas** (recomendada): 5 segmentos, cada vão apontando para uma ponta da estrela | 8 |
| 02 | Vários stories: 8 segmentos | 8 |
| 03 | Adicionar ao Close: arco + traços | 6·7 |
| 04 | Visto × novo: meio roxo cheio, meio rosa tracejado | 8 |
| 05 | Rosa e roxo: 6 segmentos bicolor | 8·10 |
| 06 | Um rosa só (alternativa) | 10·3 |
| 07 | C tracejado | 5·6 |
| 08 | Disco no story (continuidade) | 3·8 |
| 09 | Selo do Close | 8 |
| 10 | Close aberto | 5 |

## Gerar de novo

```bash
cd clozzy/marca/logo-possibilidades && python3 _marcas.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-possibilidades
```
