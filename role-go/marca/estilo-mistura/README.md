# RolêGo — mistura (amostra)

Mistura de [`../image.png`](../image.png) (posts em degradê) com a [amostra “Viva o rolê”](../estilo-viva-o-role/README.md), com todas as cores juntas. **Amostra para aprovação; ainda não é a identidade vigente.**

| Arquivo | O que é |
|---|---|
| [`amostra-mistura-rolego.pdf`](amostra-mistura-rolego.pdf) · `.html` | 4 págs.: capa, cores e conceitos, peças e posts |
| [`posts/`](posts/) | 6 posts 1080 × 1080 em PNG |
| `_base.py` · `_feed.py` · `_build.py` | Cores e elementos, posts, documento |

## Cores

Lima `#D6E905` · ciano `#68E2E3` · anil `#452EFF` · roxo `#6D34CC` · violeta `#9E19E9` · magenta `#F60CED` · rosa `#CB4C7B` · pêssego `#FA9B56` · preto · branco.

Degradê da mistura (risco, G gigante, contornos): pêssego → rosa → magenta → violeta → roxo → anil → ciano → lima.

## O que vem de cada um

- **Posts:** degradê violeta → roxo → anil, Poppins itálico, ciano no destaque, G gigante, tags e pílulas.
- **Viva o rolê:** pincel lima, risco, arcos de canto, multidão com fumaça e luz, caixa alta condensada nos chips.

## Pendências antes de usar fora

- O lettering vem da vetorização de [`../criativos/img/multidao-2.png`](../criativos/img/multidao-2.png), de origem não confirmada; a foto da multidão é um recorte pequeno da mesma arte.
- Demais fotos são Pexels, só para uso interno.

```bash
cd role-go/marca/estilo-mistura && python3 -B _build.py
```
