# Jornada: conectar por URL

Prints: [`../src/screenshots/jornada-conectar-por-url/README.md`](../src/screenshots/jornada-conectar-por-url/README.md)  
Script: `npm run linkedin-connect -- --url 'https://www.linkedin.com/in/…'`  
API robot: `npm run linkedin-connect-api` → `POST /connect`  
Callback vendas: `POST {PROFILES_API_URL}/client-connections-linkedin` só após **Pending** (`status: 1`)

## Passos

1. Recebe URL `linkedin.com/in/…`
2. Abre perfil: `am start VIEW` + package LinkedIn
3. **Connect** no header → tap; senão só **Follow** → ⋮ → **Connect** no sheet
4. Dialog note → tap **Skip** (nunca Add a note)
5. Confirma **Pending** no OCR — sem Pending = falha
6. Sucesso → notifica API (`/client-connections-linkedin`, `agentId` + `status: 1`)

## Uso

```bash
cd screen-robot/src
# CLI
PROFILES_API_URL=http://localhost:3000 AGENT_ID=ConnectMax_Cam \
  npm run linkedin-connect -- --url 'https://www.linkedin.com/in/…'

# API local (fila 1 job)
PROFILES_API_URL=http://localhost:3000 npm run linkedin-connect-api
curl -s -X POST http://127.0.0.1:3099/connect \
  -H 'content-type: application/json' \
  -d '{"url":"https://www.linkedin.com/in/…"}'
```

**Antes → depois:** conexão só na lista People → deep link por URL + Pending obrigatório + POST `/client-connections-linkedin`.  
**Rollback:** não use `linkedin-connect`; ignore o POST / drop `client_connection_linkedin` na vendas/api.
