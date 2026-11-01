# 021 — Vitrine da loja em grid (estilo iFood)

| Campo | Valor |
|-------|--------|
| Número | 021 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Vitrine de produtos na tela da loja em grid (ref. lista + iFood) |

## Prompt original

```
na tela da loja, crie uma vitrine de produtos como na ba lista de potudos e com referencias do ifood
```

```
na tela da loja, crie uma vitrine de produtos como na ba lista de potudos e com referencias do ifood mas em grid
```

## Interpretação

No detalhe do estabelecimento (`?loja=`), substituir a tabela de itens por grade de cards (foto + nome + preço + data), no mesmo padrão da aba Produtos / feed iFood; clique abre o detalhe do produto.

## O que foi feito

- `index.html` / `lista.js` / `styles.css`: catálogo da loja em `produto-grid`
- REQ-018 atualizado; deploy Contabo `public/`
