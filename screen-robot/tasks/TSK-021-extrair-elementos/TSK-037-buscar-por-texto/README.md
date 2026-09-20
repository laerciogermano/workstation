# TSK 037 buscar por texto

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-037-buscar-por-texto` |
| TSK | [`TSK-037`](../../7.tasks.md) |
| Origem | US-23 · SC-29 |
| Pai | [`TSK-021`](../README.md) |

## Entradas

- Serial do agent; texto-alvo; limiar de score (opcional)

## Execução

- `findByText(serial, query)` encapsula `extractElements` (OCR interno)
- Retorna elementos **lado a lado** cujo texto unido está **contido na string maior** (query)

## Saídas

- `{ elements, score, center? }` — adjacentes dentro da query · aceite SC-29 / SC-30
