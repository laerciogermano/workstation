# Clozzy — Glifos sólidos (rodada 15 · experimentos)

Experimentos **no caminho do Tinder**, mas sem copiar a forma: uma forma cheia só, sem anel nem contorno, com curvas e uma ponta viva. Ela se reconhece de longe e funciona sozinha no ícone (glifo branco num tile chapado). As formas vêm do universo da Clozzy: estrela de close friends, story, câmera, vídeo e conteúdo exclusivo. Não tem chama nem degradê.

| Arquivo | O que é |
|---|---|
| [`glifos-logo-clozzy.pdf`](glifos-logo-clozzy.pdf) · `.html` | 10 páginas: capa, o caminho, glifos 01–06 e 07–13, ícones em tile rosa e preto, lockups no preto e no claro, teste de 16 px e os três favoritos |
| `svg/` | Por glifo: `{slug}.svg` (Pink Deep, vazado), `-{preto,rosa,roxo,branco,cream}`, `-lockup-{fundo}`, `-empilhado-{preto,branco}`, `-app-{rosa,preto,roxo}` (208 arquivos) |
| [`_glifos.py`](_glifos.py) · [`_build.py`](_build.py) | Geradores (geometria · documento) |

## Os treze

| # | Slug | Ideia |
|---|---|---|
| **01** | `g01-estrela-macia` | **Favorito** — estrela gorda, pontas redondas, levemente inclinada; a mais “Tinder” |
| 02 | `g02-brilho` | Estrela de lados cavados, pontas vivas |
| 03 | `g03-lente` | Disco/lente com estrela vazada e reflexo |
| **04** | `g04-diafragma` | **Favorito** — obturador de 5 lâminas, abertura em estrela |
| 05 | `g05-camera` | Câmera arredondada, estrela na lente |
| **06** | `g06-play` | **Favorito** — play redondo com estrela vazada |
| 07 | `g07-story` | Card 9:16 com barrinhas de progresso |
| 08 | `g08-bolha` | Balão de DM com estrela |
| 09 | `g09-fechadura` | Fechadura com a cabeça em estrela |
| 10 | `g10-cadeado` | Cadeado com a alça aberta (story) |
| 11 | `g11-cometa` | Estrela com cauda fluida (movimento, vídeo) |
| 12 | `g12-espiar` | Olho com íris em estrela |
| 13 | `g13-gota` | Pin/gota com estrela |

## Cor

Tudo chapado. No preto, o glifo é rosa e os recortes ficam **brancos** (se vazassem, apareceria preto dentro do rosa). No rosa e no roxo, tudo branco, e os recortes vazam a cor do fundo. No claro, Pink Deep. Palavra em Gabarito 800, sempre separada do símbolo.

## Gerar de novo

```bash
cd clozzy/marca/logo-glifos
python3 _glifos.py && python3 _build.py
```

Depende de [`../logo-final-v3/_marca.py`](../logo-final-v3/_marca.py) (lockups, palavra) e do CSS da [rodada 4](../logo-possibilidades/_build.py). Para trocar os favoritos, edite `MAIN` em `_glifos.py`.
