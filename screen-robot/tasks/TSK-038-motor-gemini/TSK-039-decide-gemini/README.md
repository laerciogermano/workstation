# decide (Gemini + OCR)

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-039-decide-gemini` |
| TSK | [`TSK-039`](../../../7.tasks.md) |
| Origem | US-24 · SC-31 |

## Entradas

- Fixture OCR [`agent-ocr-people-connect.json`](../../../src/test/fixtures/agent-ocr-people-connect.json)
- Cliente [`gemini.js`](../../../src/lib/gemini.js)

## Execução

- Implementar `decide({ prompt, ocr, history })` → `{ resumo, acao }` JSON
- Validar types: tap/scroll/type/key/sleep/done/fail
- Teste stub: `lib/agent-decide.test.js`

## Saídas

- `decide` retorna ação válida a partir de OCR; coords na escala do device
