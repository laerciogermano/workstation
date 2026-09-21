# Evento de boot

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-006-evento-de-boot` |
| TSK | [`TSK-006`](../../../7.tasks.md) |
| Origem | US-02 · SC-04 |
| Pai | [`TSK-005-eventos-de-ui`](../README.md) |

## Entradas

- Serial online (handle EP-01)
- `timeoutMs` / `intervalMs` opcionais

## Execução

- Componente interno `waitBoot` — poll `sys.boot_completed` até `1`
- Expor via `on({ event: "boot", … })`

## Saídas

- `{ boot: true }` · erro `EVENT_BOOT_TIMEOUT`
