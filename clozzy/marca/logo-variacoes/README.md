# Clozzy — Variações do logo (rodada 13)

Doze variações possíveis, todas a partir do [logo final v3](../logo-final-v3/README.md). Cada uma muda **uma coisa só** e mantém o resto do DNA: anel de story grosso (9,5), forma de C com a linha cheia à esquerda, tracejado à direita, estrela original inscrita no círculo central, palavra Gabarito 800 separada do símbolo e as regras de cor.

| Arquivo | O que é |
|---|---|
| [`variacoes-logo-clozzy.pdf`](variacoes-logo-clozzy.pdf) · `.html` | 9 páginas: capa, o que fica e o que muda, variações 01–06 e 07–12, lockups no preto e no claro, ícones de app, teste de 32/24/16 px e os três caminhos recomendados |
| `svg/` | Por variação: `{slug}.svg` (Pink Deep, sem fundo), `-{preto,rosa,roxo,cream,branco}`, `-lockup-{fundo}`, `-empilhado-{preto,branco}`, `-app-{rosa,preto,roxo}` (192 arquivos) |
| [`_variacoes.py`](_variacoes.py) · [`_build.py`](_build.py) | Geradores (geometria · documento) |

## As doze

| # | Slug | O que muda |
|---|---|---|
| 01 | `v01-final` | Referência: o logo final v3 sem mudança |
| **02** | `v02-dois-tracos` | **Favorita** — C de 270° e 2 traços longos; a melhor em 16 px |
| 03 | `v03-quatro-tracos` | Abertura de 150° com 4 traços |
| 04 | `v04-crescente` | Traços alongam do topo para baixo (1 · 1,6 · 2,6) |
| 05 | `v05-um-traco` | Um traço longo solto na abertura |
| 06 | `v06-giro` | Abertura girada para o canto de cima à direita (−45°) |
| **07** | `v07-disco` | **Favorita** — anel mais leve (7), disco cheio e estrela vazada (print `refs/…15.01.35`) |
| **08** | `v08-squircle` | **Favorita** — o mesmo C em quadrado de cantos redondos |
| 09 | `v09-estrela-linha` | Estrela em linha (monoline) |
| 10 | `v10-faisca` | O primeiro traço vira uma estrela pequena |
| 11 | `v11-raios` | Abertura em 5 raios curtos |
| 12 | `v12-duas-cores` | Traços numa segunda cor: brancos no preto, roxos no claro |

## Cor

Valem as regras de sempre: no preto, anel rosa com estrela e palavra brancas; no rosa e no roxo, tudo branco; no claro, símbolo Pink Deep e palavra ink. Nada preto sobre rosa, e rosa e roxo nunca um sobre o outro. Por isso o **disco no preto** leva estrela branca em vez de vazada (vazada mostraria preto no rosa). Na **duas cores**, roxo e Deep ficam lado a lado, nunca sobrepostos.

## Gerar de novo

```bash
cd clozzy/marca/logo-variacoes
python3 _variacoes.py && python3 _build.py
```

Depende de [`../logo-final-v3/_marca.py`](../logo-final-v3/_marca.py) (constantes `RING`, `STAR`, `OPEN`, `DUTY`) e do CSS do documento da [rodada 4](../logo-possibilidades/_build.py). Para mudar as favoritas, edite `MAIN` em `_variacoes.py`.

## Rollback

```bash
rm -rf clozzy/marca/logo-variacoes
```
