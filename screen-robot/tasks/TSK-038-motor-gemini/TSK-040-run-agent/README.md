# runAgent loop

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-040-run-agent` |
| TSK | [`TSK-040`](../../../7.tasks.md) |
| Origem | US-25 · SC-32 |

## Entradas

- `decide` (TSK-039)
- `extract` RapidOCR · operate (`tapElement`/`scroll`/`type`/`key`)

## Execução

- Loop extract → decide → execute → log `logs/agent/*.md`
- CLI [`scripts/run-agent.js`](../../../src/scripts/run-agent.js) · smoke [`scripts/smoke-agent.js`](../../../src/scripts/smoke-agent.js)

## Saídas

- `{ status, steps, logPath }` · log com Decisão + OCR + Resultado
- Aceite smoke: 1º passo `tap` Connect **ou** `scroll` quando sem Connect
