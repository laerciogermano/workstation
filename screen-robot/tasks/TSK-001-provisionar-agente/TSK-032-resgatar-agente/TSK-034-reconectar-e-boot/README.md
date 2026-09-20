# Reconectar e boot

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-034-reconectar-e-boot` |
| TSK | [`TSK-034`](../../../../7.tasks.md) |
| Origem | SC-26 |
| Pai | [`TSK-032-resgatar-agente`](../README.md) |

## Entradas

- Runtime localizado (serial do nome)

## Execução

- `adb connect` / wait-for-device + poll `sys.boot_completed`

## Saídas

- Serial online e boot completo — handle anexável

## Documentação

- BDD SC-26 em [`5.bdds.md`](../../../../5.bdds.md#ep-01--provisionar-agente)
