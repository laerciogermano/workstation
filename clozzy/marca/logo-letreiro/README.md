# Clozzy — Letreiro e símbolo na palavra (rodada 11)

O símbolo da rodada 10 ([`../logo-c-canto-v2/`](../logo-c-canto-v2/README.md), “1 · um pouco maior em cima”: pontas inteiras, traços de 16° e 22° no canto, estrela R 18) passa a ser **a letra C do nome**, com a mesma lógica do RolêGo v4 ([`role-go/marca/identidade-v4`](../../../role-go/marca/identidade-v4/README.md)): o símbolo nunca é digitado, palavra e símbolo nunca na mesma cor (exceto as versões de uma cor), e a cor é superfície com a marca em branco. Também traz **8 letreiros** (só tipografia) e o sistema completo.

Tendência (pesquisa + `core/definir-projeto-moderno/04-logos` e `05-identidade-visual`): eixos ativos **família responsiva** (lockup → letreiro → símbolo → ícone) e **tipografia expressiva** (contador preenchido, ligadura, itálico). Ficam de fora: degradê roxo de SaaS, glow, 3D brilhante e microtexto.

| Arquivo | O que é |
|---|---|
| [`letreiro-clozzy.pdf`](letreiro-clozzy.pdf) · `.html` | 18 págs.: capa, de onde vem, 8 letreiros, letreiros em cor e 12 px, 6 símbolos na palavra, traço da letra × fino, logo system, construção e área de proteção, usos incorretos, cor, família responsiva, letreiros de apoio, app, redes, letreiro no mundo (parede, backdrop, LED, outdoor, mupi), merch, movimento, decisão |
| `svg/` | `<letreiro ou símbolo>-<fundo>.svg` e `-placa.svg` (com fundo) — 14 desenhos × 9 fundos |
| `_letreiro.py` · `_build.py` | Geradores (geometria · documento) |

## Letreiros
| # | Slug | Ideia |
|---|---|---|
| 1 | `l1-base` | Gabarito 800, aperto −18 |
| 2 | `l2-estrela-no-o` | Estrela no contador do o |
| 3 | `l3-c-do-canto` | c tracejado no canto, sem estrela, no peso da letra |
| 4 | `l4-zz-ligado` | zz encostados, o segundo em cor |
| 5 | `l5-estrela-expoente` | clozzy✦ |
| 6 | `l6-clo-zzy` | clo + zzy em cores separadas |
| 7 | `l7-italico` | Inclinação de 9° |
| 8 | `l8-leve` | Peso 500 para tamanhos grandes |

## Símbolo na palavra
| # | Slug | Ideia |
|---|---|---|
| 1 | `s1-c-simbolo` | Símbolo = C, traço 16 (peso da letra) |
| **2** | **`s2-c-simbolo-fino`** | **Recomendada**: símbolo = C, traço 11 |
| 3 | `s3-o-simbolo` | Símbolo no lugar do o |
| 4 | `s4-c-italico` | C reto + “lozzy” itálico |
| 5 | `s5-canto-expoente` | c do canto + estrela expoente |
| 6 | `s6-lockup` | Lockup lado a lado (comparação) |

Fundos (`FUNDOS` em `_letreiro.py`): rosa (principal: palavra branca, símbolo ink), preto, cream, roxo, preto e roxo com anel branco + estrela rosa, branco, uma cor branco, uma cor ink.

```bash
cd clozzy/marca/logo-letreiro && python3 _letreiro.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-letreiro
```
