# Jornada: conectar por URL

Prints: [`../src/screenshots/jornada-conectar-por-url/README.md`](../src/screenshots/jornada-conectar-por-url/README.md)  
Script: `npm run linkedin-connect -- --url 'https://www.linkedin.com/in/…'`  
API robot: `npm run linkedin-connect-api` → `POST /connect`  
Callback vendas: `POST …/client-connections-linkedin` após **Pending** (`status: 1`, default API `:3000`).  
Aceitos: listagem `/connections` → `POST …/mark-accepted` (nome OCR ↔ pendente → `status: 2`).

## Passos

1. Recebe URL `linkedin.com/in/…`
2. Abre perfil: `am start VIEW` + package LinkedIn
3. OCR: se **"This page doesn't exist"** / **"Please check your URL"** → `ok: true`, `status: discarded` + POST conexão `status: 3` com `discardReason` (sai de Candidatos → coluna Descartados; print `99-page-does-not-exist.png`)
4. **Connect** no header → tap; senão só **Follow** → ⋮ → **Connect** no sheet
5. Dialog note → tap **Skip** (nunca Add a note)
6. Confirma **Pending** no OCR — sem Pending = falha
7. Sucesso → notifica API (`/client-connections-linkedin`, `agentId` + `status: 1`)
8. Ao finalizar (ok/erro) → `am force-stop` no package LinkedIn (`closeApp: false` para pular)
9. Depois: `POST /connections` no robot → `mark-accepted` promove quem aparece na lista a `status: 2`

**Antes → depois:** 404 do LinkedIn seguia tentando Connect até timeout → agora falha imediata com `not_found`.  
**Rollback:** remova o POST `status: 3` em `hasPageDoesNotExist`; volte a `ok: false` / `status: not_found` sem descarte na API.

**Antes → depois (fechar app):** LinkedIn ficava aberto após o job → `stop()` no `finally` de `connectByLinkedInUrl`.  
**Rollback:** `closeApp: false` ou remova o `finally`/`stop`.

## Uso

```bash
cd screen-robot/src
AGENT_ID=ConnectMax_Cam npm run linkedin-connect -- --url 'https://www.linkedin.com/in/…'
npm run linkedin-connect-api
curl -s -X POST http://127.0.0.1:3099/connect \
  -H 'content-type: application/json' \
  -d '{"url":"https://www.linkedin.com/in/…"}'
curl -s -X POST http://127.0.0.1:3099/connections -d '{"n":20}'
```

**Antes → depois:** POST opcional → obrigatório (1); listagem marca aceitos (2).  
**Rollback:** `notifyApi: false` / ignore mark-accepted; drop `client_connection_linkedin` se necessário.
