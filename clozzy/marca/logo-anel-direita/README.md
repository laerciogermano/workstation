# Clozzy — Anel com os traços à direita (rodada 12)

Oito exemplos do símbolo do print [`refs/Captura de Tela 2026-11-11 às 14.03.10.png`](../refs/): **linha cheia abraçando a esquerda, traços soltos descendo pela direita** e a estrela original (R 20,5) no meio. Anel externo 45 no grid de 100, espessura 8 (a do print), pontas redondas.

**Tile invertido:** o ícone de app do print [`…14.31.06.png`](../refs/) tinha o tracejado **à esquerda**. Antes → depois: traços à esquerda → **traços à direita**, com a linha cheia entrando pelo lado em que o olho começa a ler. Saem em rosa, preto, roxo e branco (`-app-*`).

| Arquivo | O que é |
|---|---|
| [`anel-direita-clozzy.pdf`](anel-direita-clozzy.pdf) · `.html` | 6 páginas: capa, de onde vem (os dois prints + a inversão), 8 exemplos, tiles invertidos, cor e tamanho, decisão |
| `svg/` | Por exemplo: `-deep`, `-rosa`, `-branco`, `-ink`, `-roxo`, `-rosa-estrela-branca`, `-16`, `-16-branco`, `-app-{rosa,preto,roxo,branco}`, `-lockup`, `-lockup-preto` |
| [`_anel.py`](_anel.py) · [`_build.py`](_build.py) | Geradores (geometria · documento) |

## Os oito exemplos

| # | Slug | O que muda |
|---|---|---|
| **1** | `a-print` | **Recomendado** — igual ao print: traço 8, quatro traços desiguais |
| 2 | `b-tres` | Três traços longos: o mais limpo de longe |
| 3 | `c-cinco` | Cinco traços iguais, ritmo de story carregando |
| 4 | `d-seis` | Traço 7 com seis partes: o mais picotado |
| 5 | `e-iguais` | Os quatro traços do print, todos do mesmo tamanho |
| 6 | `f-crescente` | Traços alongam do topo para baixo |
| 7 | `g-grosso` | Mesma geometria com traço 10 (estrela R 19,5) |
| 8 | `h-meia-volta` | Tracejado na metade direita exata (−90° a 90°) |

O setor tracejado vai de **−96° a 46°** (do topo, pela direita, até a curva de baixo) e a linha cheia fecha de 62° a 250°. Os exemplos com traços iguais vêm de `even(n, duty)` em [`_anel.py`](_anel.py); os desiguais (`a-print`, `f-crescente`) têm os ângulos escritos à mão.

## Cor

Vale a regra das rodadas anteriores: nada de preto sobre o rosa, rosa e roxo nunca um sobre o outro, **sobre preto o anel é rosa e a estrela branca**, sobre rosa e roxo o símbolo é todo branco. No claro, Pink Deep `#E0005A`.

## Gerar de novo

```bash
cd clozzy/marca/logo-anel-direita
python3 _anel.py && python3 _build.py
```

Ajustes em [`_anel.py`](_anel.py): `W` (espessura), `STAR_R` (estrela), `A0`/`A1` (onde começa e acaba o tracejado), `VARIANTS` (os exemplos). Para voltar os traços para a esquerda, espelhar os ângulos (`a → 180 − a`) ou usar [`../logo-circulo-tracejado/`](../logo-circulo-tracejado/README.md), que tem as duas orientações.

## Rollback

```bash
rm -rf clozzy/marca/logo-anel-direita
```
