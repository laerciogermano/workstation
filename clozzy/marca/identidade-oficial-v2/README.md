# Clozzy — Identidade oficial v2 (arco mais grosso)

Cópia da [`identidade-oficial/`](../identidade-oficial/README.md) com **só o símbolo alterado**: o arco ficou mais grosso para acompanhar o peso do **Gabarito 800** do nome. Fonte do nome, lockup (anel 1,4× o l, vão 0,35 l), cores, regras, textos e as 16 páginas são os mesmos.

| | Antes (`identidade-oficial`) | Depois (v2) |
|---|---|---|
| Espessura do arco | 9 | **11,5** |
| Vão entre os traços | 10° | **11°** (o traço mais grosso precisava de um pouco mais de respiro) |
| Corte pequeno (≤ 32 px) | espessura 13 | **15,5** |
| Estrela, traços (16° e 22°), diâmetro | R 18 · 16° e 22° · r 45 | iguais |

| Arquivo | O que é |
|---|---|
| [`identidade-clozzy-oficial-v2.pdf`](identidade-clozzy-oficial-v2.pdf) · `.html` | O documento, 16 páginas |
| `svg/` | Os mesmos 53 arquivos, com o arco novo |
| `_marca.py` | `RING_W`, `RING_GAP`, `RING_WS` definem o arco; troca `T.SYM` do letreiro v2 |
| `_build.py` | Gerador (igual ao original; as páginas de construção e mínimos leem os valores do arco) |

```bash
cd clozzy/marca/identidade-oficial-v2 && python3 _marca.py && python3 _build.py
```

Depende de `../logo-letreiro-v2/` e `../identidade-nova/fonts/`.

## Caminho inverso
- Para voltar ao arco fino: [`../identidade-oficial/`](../identidade-oficial/README.md) (não foi alterada) ou `RING_W, RING_GAP, RING_WS = 9, 10, 13` em `_marca.py` e rodar os dois scripts.
- Mais ou menos grosso: mude `RING_W` (11,5) e, se os traços encostarem, `RING_GAP`.

## Rollback

```bash
rm -rf clozzy/marca/identidade-oficial-v2
```
