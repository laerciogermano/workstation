# Clozzy — Círculo próximo tracejado (rodada 5)

Base: print [`13.25.20`](../../refs/) (Círculo próximo) com o anel do print `13.43.37` **espelhado para a direita**.

**Regras desta rodada** (antes → depois vs. rodada 4):

| | Rodada 4 | Rodada 5 |
|---|---|---|
| Estrela | arredondada, menor | **original** do Círculo próximo (R 20,5 · miolo 0,48 · canto 5 · grid 100) |
| Anel | tracejado grosso (24/256) | **fino: traço 10** (original 16), mesmo diâmetro externo 45 |
| Tracejado | ao longo do anel | só **do meio pra ponta**, traços de tamanhos diferentes |
| Lado | traços à esquerda (print) | traços à **direita**, arco cheio à esquerda |
| Cor | Pink Clozzy | **Pink Deep #E0005A** como principal |

| Arquivo | O que é |
|---|---|
| `story-espelhado-clozzy.pdf` · `.html` | **5b · Story espelhado**: print 13.43 invertido para a direita + estrela original. 8 págs., 6 variações, recomendada E |
| `circulo-tracejado-clozzy.pdf` · `.html` | **5a · Círculo próximo tracejado**: tracejado só perto da ponta / do meio pra ponta. 8 págs., variações A–D, recomendada B |
| `svg/` | Masters por variação (ver tabela de sufixos) |
| `_circulo.py` | Gera os SVGs (geometria + temas) |
| `_build.py` | Gera o 5b `story-espelhado-clozzy` (usa o CSS da rodada 4) |
| `_build_ponta.py` | Gera o 5a `circulo-tracejado-clozzy` (reaproveita as páginas do `_build.py`) |

## Variações

| # | Arquivo | Desenho |
|---|---|---|
| **E** | `e-espelhado` | **Recomendada** — arco cheio à esquerda, 4 traços iguais subindo pela direita |
| F | `f-espelhado-variado` | Mesmo desenho com traços de tamanhos diferentes (curto, longo, ponto, longo) |
| A | `a-ponta` | Cheio até perto da ponta de cima; quebra só ali |
| B | `b-meio` | Do meio do C até a ponta, traços rareando |
| C | `c-meio-largo` | Do meio, poucos traços grandes |
| D | `d-ponta-curta` | Só a pontinha picotada |

## Sufixos (cada variação tem todos)

| Sufixo | Anel / estrela | Uso |
|---|---|---|
| `-color` | Deep / Deep | principal, uma cor só |
| `-ink-star` | Deep / Ink | igual ao print 13.43 — logo grande no claro |
| `-ink-star-pink` | Pink Clozzy / Ink | mesma dupla, rosa mais claro |
| `-pink` · `-roxo` | Pink / Pink · Deep / Roxo v1 | alternativas |
| `-dark` · `-dark-pink` | Deep · Pink sobre ink | fundo escuro (no ink, Pink Clozzy brilha mais) |
| `-tile` · `-mono` | branco · ink | sobre Pink Deep · carimbo, bordado |
| `-16` · `-16-dark` | traço 14, menos traços | 16–20 px |
| `-app-deep` · `-app-cream` · `-app-ink` | ícone 100 com raio 22,6 | ícone de app |
| `-lockup` · `-lockup-dark` · `-lockup-ink-star` · `-lockup-roxo` · `-lockup-pink` | símbolo + wordmark Gabarito 800 | horizontal |

## Gerar de novo

```bash
cd clozzy/marca/logo-circulo-tracejado
python3 _circulo.py && python3 _build.py && python3 _build_ponta.py
```

Mudar o desenho: ângulos visíveis em `VARIANTS` de [`_circulo.py`](_circulo.py) (0° = direita, 90° = baixo; o C vai de −3,4° a 327,4°). Espessura: `W_MAIN` (grande) e `W_SMALL` (16 px). Recomendada no documento: `MAIN` em [`_build.py`](_build.py).

## Rollback

```bash
rm -rf clozzy/marca/logo-possibilidades/circulo-tracejado   # volta para a rodada 4 (../README.md)
```

## Rollback

```bash
rm -rf clozzy/marca/logo-circulo-tracejado
```
