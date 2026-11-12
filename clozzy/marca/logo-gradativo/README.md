# Clozzy — C gradativo (rodada 6)

Parte da rodada 5 ([`../logo-circulo-tracejado/`](../logo-circulo-tracejado/README.md): E espelhado, A–D) e do print 5 (Círculo próximo).
**Regras:** forma de **C** (abertura de 54° em −18°) · **estrela original** · traço 10 · só a ponta de cima, **depois da metade**, vira **pontos que crescem do menor ao maior** até virar a linha · discreto (≈ 1/6 do C) · cores primárias: rosa (Pink Clozzy/Deep), preto (ink), branco e roxo.

| Arquivo | O que é |
|---|---|
| [`c-gradativo-clozzy.pdf`](c-gradativo-clozzy.pdf) · `.html` | Documento com 10 páginas: origem, construção, 6 possibilidades, quantos pontos, 16 usos em cor, ícones e lockups, tela e animação, decisão |
| `svg/` | Por possibilidade (`c1`…`c6`): `-color`, `-pink`, `-roxo`, `-ink-star`, `-dark`, `-tile`, `-mono`, `-16`, `-16-dark`, `-app-{rosa,roxo,preto,branco,deep,ink}`, `-lockup*`, e `-uso-<combinação>{,-lockup,-16}` (16 combinações) |
| `_gradativo.py` · `_build.py` | Geradores |

| # | Possibilidade |
|---|---|
| **1** | **C gradativo** (recomendada): 4 pontos na ponta de cima |
| 2 | C gradativo sutil: 3 pontos (a mais discreta) |
| 3 | C gradativo, 5 pontos |
| 4 | Ponta de baixo |
| 5 | Ponto → traço |
| 6 | C mais aberto |

```bash
cd clozzy/marca/logo-gradativo && python3 _gradativo.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-gradativo
```
