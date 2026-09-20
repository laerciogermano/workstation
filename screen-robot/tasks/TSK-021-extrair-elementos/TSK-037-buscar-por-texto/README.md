# TSK 037 buscar por texto

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-037-buscar-por-texto` |
| TSK | [`TSK-037`](../../7.tasks.md) |
| Origem | US-23 · SC-29 · SC-30 |
| Pai | [`TSK-021`](../README.md) |

## Entradas

- Serial do agent **ou** fixture de frame; texto-alvo (string maior); limiar de score (opcional)

## Execução

- `findByText(serial, query)` encapsula `extractElements` (OCR interno)
- Retorna elementos **lado a lado** cujo texto unido está **contido na string maior** (query)
- Aceite LinkedIn: query `"Sign in with Email"` → `Sign` + `in` + `with` + `Email`

## Saídas

- `{ elements, score, center? }` — adjacentes dentro da query · aceite SC-29 / SC-30

## Testes

```bash
cd screen-robot/src
node --test --test-timeout=120000 test/bdd/sc-30-linkedin-sign-in-with-email.test.js
node --test --test-timeout=120000 lib/find-by-text.fixture.test.js
```
