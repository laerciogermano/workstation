# RolêGo — estilo “Viva o rolê” · azul, roxo e amarelo

Documento de identidade visual no estilo de [`../../image.png`](../../image.png), com o **azul** nos botões, badges e detalhes. É uma proposta para aprovar: **ainda não é a identidade vigente**.

| Arquivo | O que é |
|---|---|
| [`amostra-estilo-viva-o-role.pdf`](amostra-estilo-viva-o-role.pdf) · `.html` | 14 págs. A4: capa, paleta, tons e proporção, combinações, logo, letra/traço/foto, botões, badges e controles, app, posts (2), stories, peças e guia de bolso |
| [`posts/`](posts/) | 12 posts 1080 × 1080 em PNG |
| [`stories/`](stories/) | 4 stories 1080 × 1920 em PNG |
| [`lettering/`](lettering/) | “Viva o rolê” e “Rolê” em SVG |
| `_build.py` · `_posts.py` · `_paginas.py` · `lettering/_tracos.py` | Gerador e traçado vetorial |
| [`v1/`](v1/) | Versão anterior (4 págs.), guardada como estava |

## Paleta

| Cor | Hex | Papel |
|---|---|---|
| Azul | `#68E2E3` | ação: botões, badges, chips, ícones, datas, arco e o Go do logo |
| Roxo | `#6D34CC` | ambiente: superfícies, cartões, preço, botão em fundo claro |
| Amarelo | `#D6E905` | destaque: o pincel e um selo por peça |
| Noite | `#160A33` | texto sobre azul e amarelo; cartões no escuro |
| Violeta | `#AB05EA` | degradê roxo e fim do risco |

Base preto, branco e névoa `#F3F1FA`. Azul e amarelo nunca um sobre o outro.

Em relação à v1: saíram magenta, rosa e pêssego; o risco passou a ir de azul a roxo; as fotos ganharam duotom noite → roxo → azul.

## Pendências antes de usar fora

- O lettering foi vetorizado de [`../criativos/img/multidao-2.png`](../criativos/img/multidao-2.png), arte de origem não confirmada: confirmar o direito de uso ou redesenhar.
- A foto da multidão é um recorte pequeno (630 px) da mesma arte: trocar por foto própria em alta.
- Demais fotos são Pexels, só para uso interno.
- Eventos, endereços, preços e números das peças são exemplos fictícios.
- CMYK calculado do sRGB: fazer prova antes de imprimir.

```bash
cd role-go/marca/estilo-viva-o-role && python3 _build.py
```
