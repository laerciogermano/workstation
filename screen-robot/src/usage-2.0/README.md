# usage-2.0

Cada request à UA vira um JSON `<timestamp>.json`:

```json
{
  "entrada": {},
  "resposta": {}
}
```

- `entrada`: body HTTP literal enviado (Gemini `generateContent` ou OpenAI `chat.completions`)
- `resposta`: JSON literal da UA (`null` se a rede falhou antes do body)

Sem campos extraídos (`prompt`, `acao`, `run`, …). Legado em `src/usage/` — só leitura (não recebe writes novos).

**Antes → depois:** `usage/<stamp>.json` com run/step/prompt/response. Rollback: default `usage/` em `agent-run.js` + writer antigo.
