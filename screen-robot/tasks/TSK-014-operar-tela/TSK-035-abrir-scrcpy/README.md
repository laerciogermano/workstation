# TSK 035 abrir scrcpy

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-035-abrir-scrcpy` |
| TSK | [`TSK-035`](../../7.tasks.md) |
| Origem | US-21 · SC-27 |
| Pai | [`TSK-014`](../README.md) |

## Entradas

- Handle provisionado (EP-01+), serial ADB online
- `scrcpy` no `PATH` do host
- Script de referência: [`../../src/scripts/view.sh`](../../src/scripts/view.sh)

## Execução

- Anexar `handle.openScrcpy(opts?)` em `operate.js` / `provision.js`
- Reutilizar lógica de `view.sh` (connect ADB → spawn scrcpy no serial do handle)
- Unitário com spawn stub; BDD e2e US-21 / SC-27

## Saídas

- `handle.openScrcpy()` devolve `{ pid, serial }`
- Janela scrcpy operável (tap, digitar) no serial do agent
- Aceite: [`5.bdds.md`](../../5.bdds.md) US-21 · SC-27
- Status: **Done**
