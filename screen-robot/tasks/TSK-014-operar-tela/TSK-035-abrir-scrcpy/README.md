# TSK 035 abrir scrcpy

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-035-abrir-scrcpy` |
| TSK | [`TSK-035`](../../7.tasks.md) |
| Origem | US-21 · SC-27 |
| Pai | [`TSK-014`](../README.md) |

## Entradas

- `serial` ADB online (EP-01+)
- `scrcpy` no `PATH` do host
- Script de referência: [`../../src/scripts/view.sh`](../../src/scripts/view.sh)

## Execução

- Exportar `openScrcpy({ serial, … })` em `operate.js`
- Reutilizar lógica de `view.sh` (connect ADB → spawn scrcpy no serial)
- Unitário com spawn stub; BDD e2e US-21 / SC-27

## Saídas

- `openScrcpy({ serial })` devolve `{ pid, serial }`
- Janela scrcpy operável (tap, digitar) no serial do agent
- Aceite: [`5.bdds.md`](../../5.bdds.md) US-21 · SC-27
- Status: **Done**
