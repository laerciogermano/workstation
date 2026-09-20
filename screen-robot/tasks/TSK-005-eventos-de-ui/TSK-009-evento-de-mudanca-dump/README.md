# Evento de mudança de dump

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-009-evento-de-mudanca-dump` |
| TSK | [`TSK-009`](../../../7.tasks.md) |
| Origem | US-05 · SC-07 |
| Pai | [`TSK-005-eventos-de-ui`](../README.md) |
| Depende | [`TSK-006`](../TSK-006-evento-de-boot/README.md) |

## Entradas

- `previousXml` (opcional); serial no handle

## Execução

- Componente interno `waitDumpChange` — dump até hash ≠ base
- `handle.on("dump_change", { previousXml }, onEvent?)`

## Saídas

- `{ xml, changed: true }` · `EVENT_DUMP_TIMEOUT`
