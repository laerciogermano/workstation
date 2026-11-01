# 008 — Item único por nota

| Campo | Valor |
|-------|--------|
| Número | 008 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Itens sem duplicata na mesma nota |

## Prompt original

```
os itens nao podem ser duplicados, a chave deve ser a nota e o item, so pode haver um item por nota
```

## Interpretação

Unicidade de item dentro da nota: chave `(nota, item/código)`. Um código só uma vez por nota; histórico entre notas distintas permanece.

## O que foi feito

- UNIQUE `(nota_id, codigo)` + migração/dedupe; `ON CONFLICT DO NOTHING`; REQ-009
