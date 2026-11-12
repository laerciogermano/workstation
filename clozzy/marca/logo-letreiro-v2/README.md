# Clozzy — Letreiro e lockup (rodada 11 · v2)

**Regra:** o C do símbolo **nunca** se mistura com o “c” de clozzy, e nenhuma letra é trocada pelo símbolo. O símbolo fica sempre **ao lado** da palavra (lockup) ou **acima** dela (empilhado).

**Antes → depois:** a v1 ([`../logo-letreiro/`](../logo-letreiro/README.md)) fundia o símbolo com a palavra (“[C✦]lozzy”, “cl◎zzy”, c tracejado) e foi rejeitada. A v2 mantém o símbolo da rodada 10 sem mudança, ao lado da palavra, e tira o letreiro “c do canto”. As fusões aparecem só na página de usos incorretos.

Do RolêGo v4 ficam: palavra e símbolo em cores diferentes (exceto uma cor), cor como superfície com a marca branca, e a família lockup → empilhado → símbolo → ícone.

| Arquivo | O que é |
|---|---|
| [`letreiro-clozzy.pdf`](letreiro-clozzy.pdf) · `.html` | 18 págs.: capa, de onde vem, 7 letreiros, letreiros em cor e 12 px, 6 lockups, tamanho do símbolo, logo system, construção, usos incorretos, cor, família responsiva, letreiros de apoio, app, redes, letreiro no mundo, merch, movimento, decisão |
| `svg/` | `<slug>-<fundo>.svg` e `-placa.svg` — 13 desenhos × 9 fundos |
| `_letreiro.py` · `_build.py` | Geradores |

## Letreiros
`l1-base` · `l2-estrela-no-o` · `l3-zz-ligado` · `l4-estrela-expoente` · `l5-clo-zzy` · `l6-italico` · `l7-leve`

## Lockups
| # | Slug | Símbolo |
|---|---|---|
| 1 | `k1-compacto` | anel = altura do l |
| **2** | **`k2-equilibrado`** | **recomendado** — anel 1,4× o l, vão 0,35 l |
| 3 | `k3-simbolo-grande` | 1,75× (proporção da rodada 10) |
| 4 | `k4-leve` | equilibrado + palavra peso 500 |
| 5 | `k5-clo-zzy` | equilibrado + “zzy” na cor do símbolo |
| 6 | `k6-empilhado` | símbolo em cima |

```bash
cd clozzy/marca/logo-letreiro-v2 && python3 _letreiro.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-letreiro-v2
```
