# Eventos de UI

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-005-eventos-de-ui` |
| TSK | [`TSK-005`](../../7.tasks.md) |
| Origem | EP-02 |
| Filhas | [`TSK-006`](TSK-006-evento-de-boot/README.md) · [`TSK-007`](TSK-007-evento-de-app-aberta/README.md) · [`TSK-008`](TSK-008-evento-de-tela-estavel/README.md) · [`TSK-009`](TSK-009-evento-de-mudanca-de-frame/README.md) |
| Plano | [`implementation-plan/EP-02-eventos-de-ui.md`](../../implementation-plan/EP-02-eventos-de-ui.md) |

## Entradas

- Handle de EP-01 (`provisionEmulator` → `AgentHandle` com `on`)
- BDDs US-02..05 / SC-04..07

## Execução

- Encapsular SC-04..07 em módulos internos; API pública = `on(cfg)` (`serial` + `event` na config)
- Unitários isolados (mock/stub) ao lado de cada módulo; BDD e2e para US/EP

## Saídas

- Sinais `boot` · `app_open` · `ui_stable` · `frame_change` via handle
- Aceite EP-02 / US-02..05 verdes
