# Container nomeado

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-002-subir-e-conectar` |
| TSK | [`TSK-002`](../../../7.tasks.md) |
| Origem | SC-01 |
| Pai | [`TSK-001-provisionar-agente`](../README.md) |
| Estado | `Absent` → `Starting` → `Reachable` |

## Entradas

- Nome único do agent (`provision.name`)
- Host, imagem/runtime (`kind`)

## Execução

- Interno: alocar porta/serial livre; criar **container novo** ligado ao nome
- Falhar com `PROVISION_NAME_TAKEN` se o nome já existir
- Confirmar processo/porta alcançável

## Saídas

- Agent nomeado em execução e alcançável (`Reachable`)
- Erro típico: `PROVISION_START_FAILED` · `PROVISION_NAME_TAKEN`

## Documentação

- Cenário / BDD: [`4.scenarios.md`](../../../4.scenarios.md#ep-01--provisionar-agente) · [`5.bdds.md`](../../../5.bdds.md#ep-01--provisionar-agente)
- Plano: [`EP-01-provisionar-agente.md`](../../../implementation-plan/EP-01-provisionar-agente.md)
- Runtime: [`pocs/redroid/`](../../../pocs/redroid/README.md)
