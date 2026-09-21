# TSK 019 capturar frame

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-019-screenshot` |
| TSK | [`TSK-019`](../../7.tasks.md) |
| Origem | US-11 · SC-15 |
| Pai | [`TSK-014`](../README.md) |

## Entradas

- `serial` (EP-01+); path de saída; fonte de frame (screencap ADB; futuro câmera)

## Execução

- `screenshot({ serial, path })` — capturar **frame** e gravar arquivo de imagem

## Saídas

- Arquivo de imagem no path · aceite SC-15
