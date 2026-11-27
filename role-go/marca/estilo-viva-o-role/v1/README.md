# RolêGo — estilo “Viva o rolê” (amostra)

Amostra do estilo de [`../../image.png`](../../image.png) sobre a [identidade final v2](../identidade-final-v2/README.md), para aprovar antes do documento completo. **Ainda não é a identidade vigente.**

| Arquivo | O que é |
|---|---|
| [`amostra-estilo-viva-o-role.pdf`](amostra-estilo-viva-o-role.pdf) · `.html` | 4 págs.: capa, peças, elementos e posts |
| [`posts/`](posts/) | 6 posts 1080 × 1080 em PNG, com os assuntos de [`../image.png`](../image.png) |
| [`lettering/`](lettering/) | “Viva o rolê” e “Rolê” em SVG |
| `_build.py` · `_posts.py` · `lettering/_tracos.py` | Gerador e traçado vetorial |

## Paleta única (imagem + [cores escolhidas](../cores-escolhidas/README.md))

| Cor | Hex | Papel |
|---|---|---|
| Lima | `#D6E905` | o pincel: “Rolê” e a palavra da peça |
| Ciano | `#68E2E3` | Go do logo, arco, data e contagem |
| Roxo | `#6D34CC` | botão e luz das fotos |
| Violeta | `#AB05EA` | botão e luz das fotos |
| Magenta | `#F60CED` | luz das fotos e risco |
| Rosa | `#CB4C7B` | só no risco |
| Pêssego | `#FA9B56` | só no início do risco |

Base preto e branco. Valores da imagem convertidos para sRGB (os prints são Display P3).

## Pendências antes de usar fora

- O lettering foi vetorizado de [`../criativos/img/multidao-2.png`](../criativos/img/multidao-2.png), arte de origem não confirmada: confirmar o direito de uso ou redesenhar.
- A foto da multidão é um recorte pequeno (630 px) da mesma arte: trocar por foto própria em alta.
- Demais fotos são Pexels, só para uso interno.

```bash
cd role-go/marca/estilo-viva-o-role && python3 _build.py
```
