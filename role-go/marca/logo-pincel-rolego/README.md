# RolêGo — logo toda em pincel

O nome inteiro no traço do “ROLÊ” de [`../estilo-viva-o-role/`](../estilo-viva-o-role/README.md), **sem o símbolo Go antigo**. Nada aprovado.

| Arquivo | O que é |
|---|---|
| [`rolego-pincel-completo.pdf`](rolego-pincel-completo.pdf) · `.html` | 12 págs.: principal, 12 variações (roxo, preto, claro), paletas, ícone do app, tamanho pequeno e posts |
| `svg/` | `NN-nome-{roxo,preto,claro}.svg` (fundo transparente) e `icone-*.svg` |
| `posts/` | Os 6 posts do estilo com a logo nova, PNG 1080 × 1080 |
| `_letras.py` · `_build.py` | Letras (geometria) e gerador |

01 principal · 02 uma cor · 03 com o traço · 04 traço no Go · 05 nivelada · 06 Go maior · 07 empilhada · 08 escada · 09 adesivo · 10 sombra · 11 selo · 12 dois blocos.

**Letras:** R, O, L, Ê e o circunflexo são o traçado original. O **G** e o **segundo O** são novos, montados a partir do primeiro O (abertura em cerdas e braço; o O com leve giro e um risco seco).

**Pendência:** o lettering foi vetorizado de uma arte de origem não confirmada. Antes de virar logo, confirmar o direito de uso ou mandar redesenhar a palavra por um letrista.

```bash
cd role-go/marca/logo-pincel-rolego && python3 -B _build.py   # precisa de shapely, Pillow e Chrome
```
