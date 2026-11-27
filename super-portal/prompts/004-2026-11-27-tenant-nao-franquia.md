# 004 — Isolamento = Tenant (não franquia)

| Campo | Valor |
|-------|--------|
| Número | 004 |
| Data | 2026-11-27 |
| Origem | Chat no Cursor (workstation) |
| Título | Trocar franquia por tenant na modelagem |

## Prompt original

```
nao vai mais ser franquia, vai ser tenant
```

## Interpretação

No modelo do Super Portal, o isolamento deixa de se chamar franquia: entidade **Tenant** e FKs **`tenant_id`**.

## O que foi feito

- [`docs/modelagem-dados.md`](../docs/modelagem-dados.md) — `franquia`/`franquia_id` → `Tenant`/`tenant_id` em diagrama e tabelas.
