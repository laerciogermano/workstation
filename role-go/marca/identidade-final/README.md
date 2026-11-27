# RolêGo — Identidade visual final (primeira versão, descartada)

> **Não usar.** Substituída por [`../identidade-final-v2/`](../identidade-final-v2/README.md): a melancia nunca é fundo, só texto ou detalhe.

Documento final da marca (40 págs. A4 paisagem). Card Trello: [Identidade visual final](https://trello.com/c/d1duCYiO).

| Arquivo | O que é |
|---|---|
| [`identidade-visual-final-rolego.pdf`](identidade-visual-final-rolego.pdf) · `.html` | O documento |
| [`BRAND.md`](BRAND.md) | Guia operacional de uma página |
| [`tokens.css`](tokens.css) | Tokens; dia em `--rg-melancia` e `data-tema="melancia"` |
| [`logo/`](logo/) | Masters SVG da logo gomosa (noite) e `rolego-*-melancia.svg` (dia) |
| `_build.py` · `_dia.py` · `_paginas.py` | Geradores |

## O que mudou em relação à v5

Base: [`../identidade-v5-gomosa/`](../identidade-v5-gomosa/README.md). A noite não muda (logo gomosa, roxo `#9E19E9 → #6539CB → #452EFF`, ciano, preto, Poppins).

- **Cor do dia: melancia `#FF4D6A`, uma só e chapada** (escolhida em 2026-11-27 entre as referências do card). Na melancia: Rolê branco + Go roxo `#6539CB`.
- **Assinatura noite e dia** (capa e pág. 04): o banner das referências, com logo e slogan à esquerda e card de foto à direita.
- Páginas novas: 04 assinatura, 10 cor do dia, 14 dia e noite, 18 rolês de dia, 23 app de dia, 28 feed e stories de dia, 35 merch e praia. A 14 e a 28 seguem o layout das duas páginas de manual anexadas ao card, sem o degradê de sol.
- Melancia também em logo, usos incorretos, slogan, cores, acessibilidade, capa e contracapa.

Referências do card: [`../referencias/`](../referencias/). Estudo de cor: [`../cores-por-do-sol/`](../cores-por-do-sol/).

Os PNGs de post e story continuam em [`../identidade-v5-gomosa/`](../identidade-v5-gomosa/README.md) (noite); as peças de dia existem só dentro do documento.

Fotos ([`../fotos-festa/`](../fotos-festa/README.md), [`../fotos-sunset/`](../fotos-sunset/README.md)) são Pexels, **só para uso interno**.

## Gerar de novo

```bash
cd role-go/marca/identidade-final && python3 _build.py
```

Usa o Chrome e Pillow. As páginas herdadas vêm do build da v5: se ela mudar, este muda junto (o build falha se um trecho ajustado sumir).
