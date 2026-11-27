# RolêGo — Identidade visual final v2

Documento final da marca (40 págs. A4 paisagem). Card Trello: [Identidade visual final](https://trello.com/c/d1duCYiO).

| Arquivo | O que é |
|---|---|
| [`identidade-visual-final-v2-rolego.pdf`](identidade-visual-final-v2-rolego.pdf) · `.html` | O documento |
| [`BRAND.md`](BRAND.md) | Guia operacional de uma página |
| [`tokens.css`](tokens.css) | Tokens (`--rg-melancia`, `.rg-dia`, `.rg-sol`) |
| [`logo/`](logo/) | Masters SVG da logo gomosa |
| `_build.py` · `_dia.py` · `_paginas.py` | Geradores |

## Regra de cor

- **Principais:** roxo `#9E19E9 → #6539CB → #452EFF` e ciano `#00E5E5`, com preto e branco, de dia e de noite.
- **Terceira:** melancia `#FF4D6A`, **só texto ou detalhe**. Nunca fundo melancia nem laranja.

## O que mudou em relação à primeira versão

A [`../identidade-final/`](../identidade-final/README.md) usava a melancia como superfície das peças de dia; foi descartada em 2026-11-27. Aqui as peças de dia são roxas, pretas ou foto, o logo não tem versão para fundo melancia e a melancia aparece só em palavra, ícone ou ponto de sol.

Base: [`../identidade-v5-gomosa/`](../identidade-v5-gomosa/README.md). PNGs de post e story continuam lá; as peças de dia existem só dentro do documento. Fotos Pexels, **só para uso interno**.

## Gerar de novo

```bash
cd role-go/marca/identidade-final-v2 && python3 _build.py
```
