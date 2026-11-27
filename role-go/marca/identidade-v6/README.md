# RolêGo — Identidade visual v6

Documento de identidade (40 págs. A4 paisagem) sobre as três cores de [`../cores-escolhidas/`](../cores-escolhidas/README.md).

| Arquivo | O que é |
|---|---|
| [`identidade-visual-rolego-v6.pdf`](identidade-visual-rolego-v6.pdf) · `.html` | O documento |
| [`BRAND.md`](BRAND.md) | Guia operacional de uma página |
| [`tokens.css`](tokens.css) | Cores, tipo, raio e motion |
| [`logo/`](logo/) | Masters SVG nas cores novas |
| [`posts/`](posts/) · [`stories/`](stories/) | 9 posts e 3 stories em PNG (HTML em `_src/`) |
| [`motion-guidelines.md`](motion-guidelines.md) · [`motion/`](motion/logo-reveal.html) | O pin drop |
| `_cores.py` · `_build.py` · `_dia.py` · `_paginas.py` | Geradores |

## Cor

- **Principais:** roxo `#6D34CC` e ciano `#68E2E3`, com preto e branco.
- **Terceira:** rosa `#EA3D7A`, **só texto ou detalhe**, nunca fundo.
- Sempre chapadas, sem degradê entre elas.

## De onde vem

Logo gomosa, tipografia, fotos e peças: [`../identidade-v5-gomosa/`](../identidade-v5-gomosa/README.md). Assinatura noite e dia e a regra da terceira cor: [`../identidade-final-v2/`](../identidade-final-v2/README.md). O build executa o v5, troca a paleta em `_cores.py` e refaz as páginas de cor; se o v5 mudar, este muda junto (o build falha se um trecho ajustado sumir).

Fotos Pexels, **só para uso interno**.

## Gerar de novo

```bash
cd role-go/marca/identidade-v6 && python3 _build.py
```
