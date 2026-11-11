# Clozzy — Logo v6 (quebra no canto)

O círculo forma um **C com as duas pontas inteiras** (linha cheia nas extremidades) e a única interrupção fica na **concavidade superior esquerda**: três traços com vão largo, dimensionado para o tracejado continuar visível em 16 px.

Base: [`../refs/`](../refs/) (Círculo próximo e anel de story) e a [`../logo-v5/`](../logo-v5/README.md). Estrela original (R 20,5 · miolo 0,48 · canto 5, grid 100), traço 10, abertura de 54° centrada em −18°.

**Antes → depois (v5 → v6):** a quebra terminava o C na ponta de cima (progressão ponto → traço → linha) → agora as **pontas são sempre cheias** e o tracejado é um trecho isolado centrado em **225°**, com traços iguais de 14 e vão de 6,5 (ao todo 68 un, 98°). Rollback: usar `v5a-gradativo-*`; `rm -rf clozzy/marca/logo-v6`.

| Arquivo | O que é |
|---|---|
| [`logo-v6-clozzy.pdf`](logo-v6-clozzy.pdf) · `.html` | 12 páginas: origem, construção, 6 possibilidades, o vão, paleta, usos em cor, ícone e lockup, **utilizações**, tela e movimento, decisão |
| `svg/` | Por possibilidade (`v6a`…`v6f`): `-rosa`, `-preto`, `-roxo`, `-deep`, `-estrela-preta`, `-branco`, `-16`, `-16-dark`, `-app-{rosa,roxo,preto,branco}`, `-uso-<combinação>{,-lockup,-16}` |
| `_v6.py` · `_build.py` | Geradores (geometria · documento) |

## Possibilidades

| # | Slug | Trecho quebrado |
|---|---|---|
| **1** | `v6a-canto` | **Recomendada** — 3 traços de 14, vão 6,5, centro 225° |
| 2 | `v6b-dois` | 2 traços de 17: a mais discreta |
| 3 | `v6c-quatro` | 4 traços de 11: mais picotado |
| 4 | `v6d-vao-largo` | 3 traços, vão 9: a mais segura no pequeno |
| 5 | `v6e-variado` | 11 · 20 · 11 — curto, longo, curto |
| 6 | `v6f-mais-alto` | Mesmo trecho centrado em 248° |

## Por que o vão é grande

Quando o logo encolhe, quem some é o espaço, não o traço. Com vão 3,0 ou 4,5 o canto fecha e vira linha contínua em 20 px; com 12,0 os traços soltam e lê como pontilhado. O corte de 16–20 px (`-16.svg`) usa espessura 12, dois traços de 17 e vão de 9.

## Paleta

| Cor | Hex | Uso |
|---|---|---|
| Preto | `#14090F` | texto, fundo escuro, versão de um tom |
| Rosa | `#FF0065` | cor do app; `#E0005A` em tamanho pequeno sobre branco |
| Branco | `#FFFFFF` | símbolo vazado sobre rosa, roxo ou preto |
| Roxo | `#7C48C4` | acento (convite, Close) |

## Gerar de novo

```bash
cd clozzy/marca/logo-v6
python3 _v6.py && python3 _build.py
```

Ajustes em [`_v6.py`](_v6.py): `CORNER` (onde fica a quebra), `DASH`/`GAP` (traço e vão), `DASH_S`/`GAP_S` (corte pequeno), `CONCEPTS` (possibilidades).

## Rollback

```bash
rm -rf clozzy/marca/logo-v6
```
