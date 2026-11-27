# Variações do Go e novas combinações

Continuação de [`../`](../README.md). O desenho da logo não muda; só cor e acabamento. Nada aprovado.

| Arquivo | O que é |
|---|---|
| [`variacoes-do-go.pdf`](variacoes-do-go.pdf) · `.html` | 28 págs.: o Go em 24 versões (logo, ícone, aplicação) e as combinações 25–40 |
| `go/` | G01–G24: dois posts por versão, com as cores da peça na paleta atual (01) |
| `combos/` | 25–40: seis posts por combinação, com o Go em cor própria |
| `_build.py` | Gerador (`GOS` e `NOVAS`) |

G01–G12 cor chapada · G13–G18 degradê · G19–G24 duas cores, contorno, adesivo, cápsulas e neon.

Acabamentos como degradê, contorno e neon pedem uma versão chapada para impressão pequena, bordado e carimbo.

```bash
cd role-go/marca/estilo-viva-o-role/combinacoes/go-variacoes && python3 -B _build.py   # tudo
python3 -B _build.py --so-pdf                                                           # só o documento
```
