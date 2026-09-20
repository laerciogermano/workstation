# TSK 036 mascarar identidade

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-036-mascarar-identidade` |
| TSK | [`TSK-036`](../../7.tasks.md) |
| Origem | US-22 · SC-28 |
| Pai | [`TSK-001`](../README.md) |

## Entradas

- Contrato geral: [`../../pocs/README.md`](../../pocs/README.md#mascarar-identidade-do-aparelho)
- Runtime/vendor configurável (`provision.kind`)

## Execução

- Garantir que **qualquer vendor** aplica perfil de aparelho de mercado (`ro.product.*` ou equivalente)
- Sem expor fingerprint/nome do runtime de automação nas props que apps leem
- Documentar/aplicar por POC; validar com `getprop` (ou equivalente) no e2e SC-28

## Saídas

- SC-28 aceite: brand/model/device de aparelho comum
- Aceite: [`5.bdds.md`](../../5.bdds.md) US-22 · SC-28
