# agent-worker — pull uniforme (AVD local)

**Por quê:** mesmo processo em servidor e PC de gestor — puxa jobs da API, executa no ADB localhost, reporta complete/fail.  
**Plano:** [`../../docs/plano-implementacao-worker-avd.md`](../../docs/plano-implementacao-worker-avd.md) · **API:** [`../api/README.md`](../api/README.md)  
**Antes:** rodízio só após N turnos idle. **Depois:** ao esvaziar a fila do agente, **troca o slot na hora**; se ainda há pending, drena com claim seguido.  
**Rollback:** pare o worker; `MODE=single`; status pode ficar `ativo` — sleep manual / `device-status`.

**Produção `144.126.154.90`:** código em `/opt/connectmax/vendas/worker`, unit `connectmax-worker` (disabled até AVD com KVM). `agent-d` aponta para esse host; VDS `185` removido do cadastro.

## Modos

### Single — 1 agente / 1 AVD

No start chama `POST /agente/:id/enroll` (cria cadastro magro se faltar; bootstrap com **key global**). LinkedIn completa no painel.

```bash
cd vendas/worker
API_URL=http://localhost:3000 \
AGENT_ID=<agentes.id uuid> \
AGENT_API_KEY=$AGENT_API_KEY_GLOBAL \
SERIAL=127.0.0.1:5560 \
HOST_KIND=localhost \
npm start
```

**Antes → depois (cadastro):** criar no painel antes do worker → worker enroll sozinho; painel só edita LI/notas. **Rollback:** remova `enroll()` em `loop.mjs`.

### Host — N slots, troca on-empty

Máx. ativos = `AVD_MAX_ATIVOS_POR_SERVIDOR` / `MAX_SLOTS`.

Por slot, após cada claim:

1. ainda tem `pending` → claim de novo (mesmo AVD)  
2. `pending=0` e há `candidatosWake` → `docker stop` + wake do próximo **na hora**  
3. ninguém pra acordar → pausa; `SLEEP_MS` só entre turnos ociosos

```bash
API_URL=http://localhost:3000 \
HOST_KEY=localhost \
AGENT_API_KEY=$AGENT_API_KEY_GLOBAL \
MODE=host \
npm run start:host

# smoke:
SKIP_DOCKER=1 DRY=1 ONCE=1 MODE=host HOST_KEY=localhost npm start
```

Use **chave global** no supervisor.

## Env

| Var | Papel |
|-----|--------|
| `MODE` | `single` \| `host` |
| `HOST_KEY` | Filtro `GET /agente/slots` |
| `MAX_SLOTS` | Override máx. ativos |
| `MAX_JOBS_PER_SLOT` | Teto de claims seguidos no mesmo AVD por ocupação (default 20) |
| `SKIP_DOCKER=1` | Só `device-status` |
| `SLEEP_MS` | Pausa entre turnos quando slots ociosos (default 15s) |
| `EXTRACT_MAX_PROFILES` | Máx. leads por extract (default **10**) |
| `DRY` / `ONCE` / `ALLOW_STUB` | Smoke / stubs |

## Handlers

| `type` | Status |
|--------|--------|
| `extrair_leads` | `login-extract-profiles` |
| `conectar` | `linkedin-connect` (URL do payload; teto diário na API) |
| `verificar_conexoes` | `linkedin-extract-connections --n 20` (lote) → `mark-accepted`; intervalo API `AGENT_CONNECTIONS_INTERVAL_MS` (default 30 min) |
| demais AC | Stub (`ALLOW_STUB=1`) até F3 |

**Antes → depois (conectar):** stub → spawn `npm run linkedin-connect -- --url … --no-shot`. Página inexistente → job OK + conexão `status=3`/`discardReason` (funil Descartados). Rollback: `conectar: makeStub('conectar')` em `handlers/index.mjs`.

## Contrato host

1. `GET /agente/slots?hostKey=`  
2. `docker start|stop` local  
3. `POST /agente/:id/device-status`  
4. claim → se vazio, rotate on-empty
