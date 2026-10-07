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
- Tokens (OpenAI): `resposta.usage.prompt_tokens` / `completion_tokens` / `total_tokens`

Escritores: [`lib/usage-write.js`](../lib/usage-write.js) — usado por `runAgent` (v1) e `decideRawAction` (raw-gpt / loop). Relatório: `npm run usage:report` → `dashboard.html`.

Abrir (HTTP; evita falha do Chart.js CDN em `file://`):

```bash
cd usage-2.0 && python3 -m http.server 8765
# http://127.0.0.1:8765/dashboard.html
```

Sem campos extraídos (`prompt`, `acao`, `run`, …). Legado em `src/usage/` — só leitura (não recebe writes novos).

**Antes → depois:** `usage/<stamp>.json` com run/step/prompt/response. Rollback: default `usage/` em `agent-run.js` + writer antigo.

**Antes → depois (raw-gpt):** decide não gravava FS → cada request escreve aqui (mesmo formato do agent). Rollback: remover `writeUsage20` em `raw-gpt-decide.js`.
