# 019 — Remover aba Notas

| Campo | Valor |
|-------|--------|
| Número | 019 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Remover aba Notas da home |

## Prompt original

```
remova a aba notas
```

## Interpretação

Home fica só Produtos + Estabelecimentos. Ingestão via FAB permanece.

## O que foi feito

- HTML/JS: remove tab/painel Notas; rotas `?nota=` / `#nota-` caem em Produtos
- REQ-017/018/025 + README + Contabo
