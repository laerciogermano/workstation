# 023 — Foto ampliada só no detalhe

| Campo | Valor |
|-------|--------|
| Número | 023 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Lightbox da foto só na tela do produto |

## Prompt original

```
nao no feed, so quando entrar na tela do produto
```

## Interpretação

Clique na foto no feed (aba Produtos / vitrine da loja) não abre lightbox — só o card abre o detalhe. Ampliar foto apenas no hero da tela de detalhe do produto.

## O que foi feito

- Removido `data-open-foto` dos cards do feed; lightbox só no detalhe
- REQ-026 atualizado; deploy Contabo `public/`
