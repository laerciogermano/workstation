# 008 — Normalizar modelagem

| Campo | Valor |
|-------|--------|
| Número | 008 |
| Data | 2026-11-27 |
| Origem | Chat no Cursor (workstation) |
| Título | Normalizar tudo na modelagem de dados |

## Prompt original

```
normalize tudo
```

## Interpretação

Remover desnormalizações (nomes/contatos/textos espelhados, sync) e introduzir **Produto** com FK em PedidoItem; NotaFiscal liga a Pedido.

## O que foi feito

- [`docs/modelagem-dados.md`](../docs/modelagem-dados.md) normalizado.
