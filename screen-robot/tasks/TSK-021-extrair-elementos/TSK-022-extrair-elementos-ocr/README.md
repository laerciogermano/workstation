# TSK 022 extrair elementos OCR

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-022-extrair-elementos-ocr` |
| TSK | [`TSK-022`](../../7.tasks.md) |
| Origem | US-13 |
| Pai | [`TSK-021`](../README.md) |

## Entradas

- `serial` (EP-01+); frame da tela

## Execução

- **OCR** sobre o frame → lista plana só de textos · `extract({ serial })`

## Saídas

- Lista `[ { type: "text", text, bounds, center }, … ]` · aceite US-13
