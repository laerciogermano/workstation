# TSK 020 resgatar coordenadas

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-020-resgatar-coordenadas` |
| TSK | [`TSK-020`](../../7.tasks.md) |
| Origem | US-12 · SC-16 |
| Pai | [`TSK-014`](../README.md) |

## Entradas

- `serial` (EP-01+); imagem template; frame/tela atual

## Execução

- `matchImage({ serial, templatePath })` — match por **visão**/template → coords para tap/type

## Saídas

- `{ x, y, confidence }` · aceite SC-16
