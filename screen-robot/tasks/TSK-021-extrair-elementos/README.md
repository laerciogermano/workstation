# Extrair elementos

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-021-extrair-elementos` |
| TSK | [`TSK-021`](../7.tasks.md) |
| Origem | EP-05 |

## Entradas

- Handle provisionado (EP-01+); fonte de **frame** (screenshot/stream/câmera)

## Execução

- Pipeline **frame → OCR/visão → árvore DOM** via `handle.extract()` (sem dump uiautomator)

## Saídas

- Árvore de componentes por tipo / completa · aceite EP-05
