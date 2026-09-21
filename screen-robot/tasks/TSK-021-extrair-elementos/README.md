# Extrair elementos

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-021-extrair-elementos` |
| TSK | [`TSK-021`](../7.tasks.md) |
| Origem | EP-05 |

## Entradas

- Handle provisionado (EP-01+); fonte de **frame** (screenshot/stream/câmera)

## Execução

- Pipeline **frame → OCR → lista plana de textos** via `handle.extract()` (sem dump uiautomator, sem árvore DOM)
- **Antes → depois:** sem enriquecimento por visão; só `type: "text"`

## Saídas

- Lista `[ { type: "text", text, bounds, center }, … ]` · aceite EP-05 (US-13 · US-23)
