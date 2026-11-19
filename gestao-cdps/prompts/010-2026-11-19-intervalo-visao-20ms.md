# 010 — Intervalo da visão = 20 ms

| Campo | Valor |
|-------|--------|
| Número | 010 |
| Data | 2026-11-19 |
| Origem | Chat no Cursor (workstation) |
| Título | Intervalo ms da visão em 20 |

## Prompt original

```
deixe o intervalo ms como 20
```

## Interpretação

Default e mínimo de `intervalMs` da visão/controle passam de 100 para 20.

## O que foi feito

- `view.mjs`: default/min `20`
- UI + `ensure-up` + docs

## Antes → depois

100 ms → 20 ms. Rollback: default/min 100 em `view.mjs` / camera-ui / server.
