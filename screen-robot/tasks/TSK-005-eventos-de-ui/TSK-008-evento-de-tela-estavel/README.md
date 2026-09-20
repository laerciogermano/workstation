# Evento de tela estável

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-008-evento-de-tela-estavel` |
| TSK | [`TSK-008`](../../../7.tasks.md) |
| Origem | US-04 · SC-06 |
| Pai | [`TSK-005-eventos-de-ui`](../README.md) |
| Depende | [`TSK-006`](../TSK-006-evento-de-boot/README.md) |

## Entradas

- Serial no handle; `stableMs` / `intervalMs` / `contains?`

## Execução

- Componente interno `waitUiStable` — dump + hash estável por `stableMs`
- `handle.on("ui_stable", opts?, onEvent?)`

## Saídas

- `{ stable: true }` · `EVENT_STABLE_TIMEOUT`
