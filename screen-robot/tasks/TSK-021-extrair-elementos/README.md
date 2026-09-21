# Extrair textos

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-021-extrair-elementos` |
| TSK | [`TSK-021`](../../7.tasks.md) |
| Origem | EP-05 · US-13 |

## Entradas

- `serial` (EP-01+); fonte de **frame** (screenshot/stream/câmera)

## Execução

- Pipeline **frame → OCR → lista plana de textos** via `extract({ serial })` (sem dump uiautomator, sem árvore DOM)
- **Antes → depois:** US-13/14/15 unificados em US-13; `handle.extract()` → `extract({ serial })`; só `type: "text"`

## Saídas

- Lista `[ { type: "text", text, bounds, center }, … ]` · aceite EP-05 (US-13 · US-23)
