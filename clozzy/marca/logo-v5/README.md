# Clozzy — Logo v5 (ponta gradativa)

O círculo abre num **C** e a ponta de cima se solta em traços de **comprimento gradativo**, sempre na **mesma espessura**:

```
·   –   ––   ———————— (C cheio)
```

Base: `a-ponta` “Só na ponta” da v4 ([`../logo-circulo-tracejado/`](../logo-circulo-tracejado/README.md)). Estrela original do Círculo próximo (R 20,5 · miolo 0,48 · canto 5, grid 100), traço 10, abertura de 54° centrada em −18°.

**Antes → depois (v4 → v5):** traços de tamanhos aleatórios na ponta → progressão geométrica de **razão 1,7** (10 → 17 → 29 unidades de arco, vãos 3,5), ponto como primeiro termo e a linha do C como último. Paleta reduzida a **preto, rosa, branco e roxo**. Rollback: usar `a-ponta-*` da v4; `rm -rf clozzy/marca/logo-v5`.

| Arquivo | O que é |
|---|---|
| [`logo-v5-clozzy.pdf`](logo-v5-clozzy.pdf) · `.html` | 11 páginas: origem, construção, 6 possibilidades, razão da progressão, paleta, usos em cor, ícone e lockup, tela e animação, decisão |
| `svg/` | Por possibilidade (`v5a`…`v5f`): `-rosa`, `-preto`, `-roxo`, `-deep`, `-estrela-preta`, `-branco`, `-16`, `-16-dark`, `-app-{rosa,roxo,preto,branco}`, `-uso-<combinação>{,-lockup,-16}` |
| `_v5.py` · `_build.py` | Geradores (geometria · documento) |

## Possibilidades

| # | Slug | Desenho |
|---|---|---|
| **1** | `v5a-gradativo` | **Recomendada** — ponto, traço, traço maior, linha (razão 1,7) |
| 2 | `v5b-sutil` | Ponto + um traço: o mínimo |
| 3 | `v5c-quatro` | Ponto + três traços |
| 4 | `v5d-razao-alta` | Razão 2,2: salto final mais dramático |
| 5 | `v5e-vaos` | Traços crescem e vãos encolhem (5,0 → 2,2) |
| 6 | `v5f-baixo` | A progressão na ponta de baixo |

## Paleta

| Cor | Hex | Uso |
|---|---|---|
| Preto | `#14090F` | texto, fundo escuro, versão de um tom |
| Rosa | `#FF0065` | cor do app; `#E0005A` em traço fino sobre branco |
| Branco | `#FFFFFF` | símbolo vazado sobre rosa, roxo ou preto |
| Roxo | `#7C48C4` | acento (convite, Close) — não é segundo logo |

Rosa e roxo juntos só dentro do símbolo (formas grandes e separadas), nunca como texto sobre fundo.

## Gerar de novo

```bash
cd clozzy/marca/logo-v5
python3 _v5.py && python3 _build.py
```

Mudar o desenho em [`_v5.py`](_v5.py): `RATIO` (razão), `GAP` (vão), `steps()` (quantos termos), `CONCEPTS` (possibilidades), `W_MAIN`/`W_SMALL` (espessura).

## Rollback

```bash
rm -rf clozzy/marca/logo-v5
```
