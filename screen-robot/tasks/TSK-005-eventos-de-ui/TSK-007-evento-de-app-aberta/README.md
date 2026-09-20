# Evento de app aberta

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-007-evento-de-app-aberta` |
| TSK | [`TSK-007`](../../../7.tasks.md) |
| Origem | US-03 · SC-05 |
| Pai | [`TSK-005-eventos-de-ui`](../README.md) |
| Depende | [`TSK-006`](../TSK-006-evento-de-boot/README.md) |

## Entradas

- `opts.pkg` (obrigatório)
- Serial no handle

## Execução

- Componente interno `waitAppOpen` — poll foreground (`pidof` / equivalente)
- `handle.on("app_open", { pkg, ... }, onEvent?)`

## Saídas

- `{ foreground: true, package, activity? }` · `EVENT_APP_TIMEOUT` · `EVENT_UNKNOWN` sem pkg
