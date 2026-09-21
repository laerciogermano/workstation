# Evento de mudança de frame

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-009-evento-de-mudanca-de-frame` |
| TSK | [`TSK-009`](../../../7.tasks.md) |
| Origem | US-05 · SC-07 |
| Pai | [`TSK-005-eventos-de-ui`](../README.md) |
| Depende | [`TSK-006`](../TSK-006-evento-de-boot/README.md) |

## Entradas

- `previousFrame` (opcional); serial no handle; fonte de imagem (screenshot/stream/câmera)

## Execução

- Componente interno `waitFrameChange` — frame até hash ≠ base (sem dump uiautomator)
- `on({ event: "frame_change", previousFrame, … })`

## Saídas

- `{ frame, changed: true }` · `EVENT_FRAME_TIMEOUT`
