# Clozzy — C com traços gradativos (rodada 7)

Correção da rodada 6 ([`../logo-gradativo/`](../logo-gradativo/README.md)): lá os **pontos cresciam de tamanho**. Aqui a **espessura é sempre a mesma** (traço 10) e o que cresce é o **comprimento**: um ponto, depois traços cada vez mais longos, até virar a linha do C.

```
·  –  ––  –––  ————————  (C cheio)
```

Forma de **C** (abertura 54° em −18°) · **estrela original** · só a ponta de cima, depois da metade · cores primárias rosa (Pink Clozzy/Deep), preto, branco e roxo.

| Arquivo | O que é |
|---|---|
| [`c-tracos-gradativos-clozzy.pdf`](c-tracos-gradativos-clozzy.pdf) · `.html` | Documento com 10 páginas: origem, construção, 6 possibilidades, quanto alongar, 16 usos em cor, ícones e lockups, tela e animação, decisão |
| `svg/` | Por possibilidade (`t1`…`t6`): cores, `-16`, apps (rosa/roxo/preto/branco), lockups e `-uso-<combinação>` |
| `_tracos.py` · `_build.py` | Geradores |

| # | Possibilidade | Ponta (graus visíveis) |
|---|---|---|
| **1** | **Traços gradativos** (recomendada) | · 18 26 36 → linha |
| 2 | Traços sutis | · 20 30 → linha |
| 3 | Traços longos | · 18 26 36 50 → linha |
| 4 | Ponta de baixo | · 18 26 36 |
| 5 | Vãos que fecham | · 18 26 36, com vãos de 4,6 → 1,8 |
| 6 | C mais aberto | · 18 26 36, abertura +12° |

```bash
cd clozzy/marca/logo-c-tracos && python3 _tracos.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-c-tracos
```
