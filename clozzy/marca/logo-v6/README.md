# Clozzy — Logo v6 (quebra no canto)

O círculo forma um **C com as duas pontas inteiras** (linha cheia nas extremidades) e a única interrupção fica na **concavidade superior esquerda**: três traços de **tamanhos diferentes**, separados por vãos também desiguais e largos o bastante para o tracejado continuar visível em 16 px.

Base: [`../refs/`](../refs/) (Círculo próximo e anel de story) e a [`../logo-v5/`](../logo-v5/README.md). Estrela original (R 20,5 · miolo 0,48 · canto 5, grid 100), traço 10, abertura de 54° centrada em −18°.

**Antes → depois (v5 → v6):** a quebra terminava o C na ponta de cima (progressão ponto → traço → linha) → agora as **pontas são sempre cheias** e o tracejado é um trecho isolado centrado em **225°**.

**Antes → depois (v6 traços iguais → desiguais):** a primeira versão usava três traços idênticos de 14 com vão fixo de 6,5 — lia como tracejado de régua. Agora **nenhuma parte repete**: traços de **9 · 19 · 13** e vãos de **6 · 8 · 6,5 · 7,5** (ao todo 69 un, 99°). Rollback: em [`_v6.py`](_v6.py), `DASHES = [14.0]*3` e `GAPS = [6.5]*4`. Para voltar à v5: usar `v5a-gradativo-*`; `rm -rf clozzy/marca/logo-v6`.

| Arquivo | O que é |
|---|---|
| [`logo-v6-clozzy.pdf`](logo-v6-clozzy.pdf) · `.html` | 12 páginas: origem, construção, 6 possibilidades, traços e vãos, paleta, usos em cor, ícone e lockup, **utilizações**, tela e movimento, decisão |
| `svg/` | Por possibilidade (`v6a`…`v6f`): `-rosa`, `-preto`, `-roxo`, `-deep`, `-estrela-preta`, `-branco`, `-16`, `-16-dark`, `-app-{rosa,roxo,preto,branco}`, `-uso-<combinação>{,-lockup,-16}` |
| `_v6.py` · `_build.py` | Geradores (geometria · documento) |

## Possibilidades

| # | Slug | Trecho quebrado |
|---|---|---|
| **1** | `v6a-canto` | **Recomendada** — traços 9 · 19 · 13, vãos 6 · 8 · 6,5 · 7,5, centro 225° |
| 2 | `v6b-dois` | 2 traços (11 · 21): a mais discreta |
| 3 | `v6c-quatro` | 4 traços (7 · 15 · 10 · 19): mais picotado |
| 4 | `v6d-vao-largo` | Mesmos traços com vãos 8,5–10,5: a mais segura no pequeno |
| 5 | `v6e-crescente` | 8 · 14 · 22 — os traços alongam na subida |
| 6 | `v6f-mais-alto` | Mesmo trecho centrado em 248° |

## Duas regras do desenho

**Nada se repete.** Traços iguais em vãos iguais viram tracejado de régua. Cada traço e cada vão tem a sua medida, então o canto lê como um story carregado pela metade.

**O vão é o que some primeiro.** Quando o logo encolhe, quem desaparece é o espaço, não o traço. Com metade dos vãos o canto fecha em 20 px; com +90% os traços soltam e lê como pontilhado. O corte de 16–20 px (`-16.svg`) usa espessura 12, dois traços (12 e 21) e vãos de 8 a 10,5.

## Cor sobre fundo colorido

**No preto:** anel **rosa** + estrela **branca** (`rosa-estrela-branca-no-preto`) — é a versão principal. Branco de um tom só segue válido para uma cor.
**No rosa e no roxo:** só branco.

Saíram três combinações: **preto no rosa** (os tons brigam e a forma fecha), **rosa no roxo** (o rosa some) e **branco + estrela rosa no preto** (no preto o anel é que é rosa). Antes → depois: a página 08 tinha 8 tiles, agora tem 4; o lockup e o favicon escuros, a capa e os cards da decisão passaram de `-uso-rosa-no-preto` para `-uso-rosa-estrela-branca-no-preto`.

Rollback: em [`_v6.py`](_v6.py), voltar as linhas `("rosa-no-preto", …, INK, PINK, PINK, WHITE)`, `("branco-estrela-rosa-no-preto", …, INK, WHITE, PINK, WHITE)`, `("preto-no-rosa", …, PINK, INK, INK, INK)` e `("rosa-no-roxo", …, PURPLE, PINK, WHITE, WHITE)` ao `USES`, e em [`_build.py`](_build.py) `dark = [8, 9, 10, 11]` → `[8, …, 15]`.

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

Ajustes em [`_v6.py`](_v6.py): `CORNER` (onde fica a quebra), `DASHES`/`GAPS` (as medidas de cada traço e vão), `DASHES_S`/`GAPS_S` (corte pequeno), `CONCEPTS` (possibilidades). `GAPS` tem sempre um item a mais que `DASHES` — o vão também entra entre o arco cheio e o primeiro/último traço.

## Rollback

```bash
rm -rf clozzy/marca/logo-v6
```
