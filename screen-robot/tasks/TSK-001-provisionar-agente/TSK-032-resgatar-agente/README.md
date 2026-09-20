# Resgatar agente

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-032-resgatar-agente` |
| TSK | [`TSK-032`](../../../7.tasks.md) |
| Origem | US-20 |
| Pai | [`TSK-001-provisionar-agente`](../README.md) |
| Filhas | [`TSK-033`](TSK-033-localizar-por-nome/README.md) · [`TSK-034`](TSK-034-reconectar-e-boot/README.md) |

## Entradas

- Nome de agent já provisionado

## Execução

- `provisionEmulator({ name })` com nome já registrado — encapsula SC-25→26
- Não cria container novo

## Saídas

- Handle pronto (nome, serial online, boot ok)
- `PROVISION_NAME_NOT_FOUND` se ausente

## Documentação

- [`4.scenarios.md`](../../../4.scenarios.md#ep-01--provisionar-agente) · [`5.bdds.md`](../../../5.bdds.md#ep-01--provisionar-agente)
- Plano: [`EP-01-provisionar-agente.md`](../../../implementation-plan/EP-01-provisionar-agente.md)
