# 022 — Clique na foto abre visualização

| Campo | Valor |
|-------|--------|
| Número | 022 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Ao clicar na foto, abrir visualização da imagem |

## Prompt original

```
ao clicar na foto deve aparecer a visualizacao da imagem
```

## Interpretação

Nos cards de produto (aba Produtos e vitrine da loja), clique na foto abre overlay/lightbox com a imagem ampliada; o restante do card continua abrindo o detalhe do produto.

## O que foi feito

- Lightbox em `index.html` / `lista.js` / `styles.css`
- REQ atualizado; deploy Contabo `public/`
