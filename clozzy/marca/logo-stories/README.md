# Clozzy — Logos com cara de stories (rodada 13)

Dez símbolos que usam a linguagem dos stories: o anel em volta da foto, o anel partido de quem postou vários, o selo “+”, o anel carregando, as barras de progresso e a tela 9:16. Todos usam a estrela da logo final v3 (5 pontas com canto redondo, inscrita no círculo) e só as cores da marca.

| # | Slug | Ideia |
|---|---|---|
| 01 | `s01-avatar` | Anel cheio, um respiro e a “foto” com a estrela recortada |
| **02** | `s02-segmentos` | **Recomendado**: anel partido em 5, como quem postou vários stories |
| 03 | `s03-visto` | 3 partes grossas (stories novos) e 2 finas (stories vistos) |
| **04** | `s04-novo` | **Recomendado**: avatar com o selo “+” de novo story |
| 05 | `s05-carregando` | Traços que crescem até virar linha, como o anel do story carregando |
| 06 | `s06-progresso` | Timer do story: 3/4 grosso, o resto é trilho fino |
| 07 | `s07-card` | Tela 9:16 em contorno, com as barras de progresso e a estrela |
| **08** | `s08-card-cheio` | **Recomendado**: o card em bloco, com as barras e a estrela recortadas (ícone de app) |
| 09 | `s09-pilha` | Pilha de stories: um card na frente e outro atrás, inclinado |
| 10 | `s10-degrade` | Anel em degradê, só Deep → Rosa; no rosa e no roxo fica branco |

**Cor:** no preto, a forma é rosa e a estrela branca. No rosa, no roxo e no Deep, tudo é branco com a estrela recortada. No claro, Pink Deep. Nunca preto sobre rosa nem rosa sobre roxo.

| Arquivo | O que é |
|---|---|
| [`stories-clozzy.pdf`](stories-clozzy.pdf) · `.html` | 5 páginas: capa, os 10 símbolos com os cortes de 32, 20 e 16 px, cor em 6 fundos, em uso (bandeja de stories, ícone de app, tela de story) e recomendação |
| `svg/` | `{slug}-{preto,rosa,roxo,deep,cream,branco}.svg` e `{slug}-app-{rosa,preto,roxo}.svg`, 90 arquivos |
| `_stories.py` · `_build.py` | Geradores: a geometria e o documento |

```bash
cd clozzy/marca/logo-stories && python3 _stories.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-stories
```
