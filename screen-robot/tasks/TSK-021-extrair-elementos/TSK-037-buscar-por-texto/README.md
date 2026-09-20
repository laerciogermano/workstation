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

- `findByText(serial, query)` encapsula `extractElements` (OCR interno); match em um elemento **ou** conjunto vizinho com similaridade elevada

## Saídas

- `{ elements, score, center? }` ≥ limiar · aceite SC-29
