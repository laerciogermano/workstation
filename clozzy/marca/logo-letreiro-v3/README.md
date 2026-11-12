# Clozzy — Letreiro e lockup (rodada 11 · v3)

**Regra:** o C do símbolo **nunca** se mistura com o “c” de clozzy, e nenhuma letra é trocada pelo símbolo. O símbolo fica sempre **ao lado** da palavra (lockup) ou **acima** dela (empilhado).

**v3:** símbolo novo no estilo do print [`refs/Captura de Tela 2026-11-11 às 14.54.44.png`](../refs/): anel com a **metade esquerda em linha cheia** e a **metade direita em traços retos, curtos e iguais**, com a estrela original dentro ([`_simbolo.py`](_simbolo.py)). Quatro variações: `t1-print` (**recomendada**: traço 5, 11 traços), `t2-mais-tracos` (traço 4, 15 traços), `t3-menos-tracos` (traço 7, 8 traços) e `t4-disco` (disco cheio com a estrela dentro).

**Cores (regras do usuário):** nada preto sobre o rosa; rosa e roxo nunca um sobre o outro; **no preto, arco rosa + estrela branca + palavra branca** (principal); no rosa, no Deep e no roxo, tudo branco; no claro, palavra ink e símbolo Pink Deep.

**Antes → depois (v2 → v3):** símbolo da rodada 10 (C com dois traços no canto) → anel do print. Fundo principal rosa com símbolo ink → preto com arco rosa e estrela branca. Combinações ink-no-rosa e rosa-no-roxo saíram e foram para os usos incorretos.

**Antes → depois (v1 → v2):** a v1 ([`../logo-letreiro/`](../logo-letreiro/README.md)) fundia o símbolo com a palavra (“[C✦]lozzy”, “cl◎zzy”, c tracejado) e foi rejeitada. A v2 mantém o símbolo da rodada 10 sem mudança, ao lado da palavra, e tira o letreiro “c do canto”. As fusões aparecem só na página de usos incorretos.

Do RolêGo v4 ficam: palavra e símbolo em cores diferentes (exceto uma cor), cor como superfície com a marca branca, e a família lockup → empilhado → símbolo → ícone.

| Arquivo | O que é |
|---|---|
| [`letreiro-clozzy.pdf`](letreiro-clozzy.pdf) · `.html` | 19 págs.: capa, de onde vem, símbolo v3 (4 variações), 7 letreiros, letreiros em cor e 12 px, 6 lockups, tamanho do símbolo, logo system, construção, usos incorretos, cor, família responsiva, letreiros de apoio, app, redes, letreiro no mundo, merch, movimento, decisão |
| `svg/` | `<slug>-<fundo>.svg` e `-placa.svg` — 13 desenhos × 9 fundos |
| `_simbolo.py` · `_letreiro.py` · `_build.py` | Geradores (símbolo · letreiros e lockups · documento) |

## Letreiros
`l1-base` · `l2-estrela-no-o` · `l3-zz-ligado` · `l4-estrela-expoente` · `l5-clo-zzy` · `l6-italico` · `l7-leve`

## Lockups
| # | Slug | Símbolo |
|---|---|---|
| 1 | `k1-compacto` | anel = altura do l |
| **2** | **`k2-equilibrado`** | **recomendado** — anel 1,4× o l, vão 0,35 l |
| 3 | `k3-simbolo-grande` | 1,75× |
| 4 | `k4-leve` | equilibrado + palavra peso 500 |
| 5 | `k5-clo-zzy` | equilibrado + “zzy” na cor do símbolo |
| 6 | `k6-empilhado` | símbolo em cima |

```bash
cd clozzy/marca/logo-letreiro-v3 && python3 _letreiro.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-letreiro-v3
```
