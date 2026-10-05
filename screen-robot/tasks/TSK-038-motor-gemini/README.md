# Motor Gemini

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-038-motor-gemini` |
| TSK | [`TSK-038`](../../7.tasks.md) |
| Origem | EP-07 |

## Entradas

- EP-04 / EP-05 estáveis (`extract`, `tapElement`, `scroll`, `type`, `key`)
- `GEMINI_API_KEY` · modelo `gemini-3.8-flash`
- POC [`src/test/output/poc-vision/`](../../src/test/output/poc-vision/custos-por-agente.md)

## Execução

- Entregar `decide` + `runAgent` + CLI `npm run agent` (prompt como input; sem jornada hardcoded)
- Filhas: [`TSK-039`](TSK-039-decide-gemini/README.md) · [`TSK-040`](TSK-040-run-agent/README.md)

## Saídas

- Interfaces documentadas · testes SC-31/32 · smoke `npm run agent:smoke`
- Plano: [`implementation-plan/EP-07-motor-gemini.md`](../../implementation-plan/EP-07-motor-gemini.md)

**Antes → depois:** decisão manual no chat → motor Gemini. Rollback: não chamar `runAgent`.
