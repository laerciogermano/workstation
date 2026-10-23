# Jornada: conectar por URL

Prints: [`../src/screenshots/jornada-conectar-por-url/README.md`](../src/screenshots/jornada-conectar-por-url/README.md)  
Script: `npm run linkedin-connect -- --url 'https://www.linkedin.com/in/…'`  
API robot: `npm run linkedin-connect-api` → `POST /connect`  
Callback vendas: `POST …/client-connections-linkedin` após **Pending** (`status: 1`, default API `:3000`).  
Aceitos: listagem `/connections` → `POST …/mark-accepted` (nome OCR ↔ pendente → `status: 2`).

## Passos

1. Recebe URL `linkedin.com/in/…`
2. Abre perfil: `am start VIEW` + package LinkedIn
3. **Connect** no header → tap; senão só **Follow** → ⋮ → **Connect** no sheet
4. Dialog note → tap **Skip** (nunca Add a note)
5. Confirma **Pending** no OCR — sem Pending = falha
6. Sucesso → notifica API (`/client-connections-linkedin`, `agentId` + `status: 1`)
7. Depois: `POST /connections` no robot → `mark-accepted` promove quem aparece na lista a `status: 2`

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
