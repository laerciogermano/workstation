# Extrair elementos

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-021-extrair-elementos` |
| TSK | [`TSK-021`](../7.tasks.md) |
| Origem | EP-05 |

## Entradas

- Handle provisionado (EP-01+); fonte de **frame** (screenshot/stream/câmera)

## Execução

- Pipeline **frame → OCR/visão → lista plana** via `handle.extract()` (sem dump uiautomator, sem árvore DOM)

## Saídas

- Lista de elementos por tipo / completa · aceite EP-05
