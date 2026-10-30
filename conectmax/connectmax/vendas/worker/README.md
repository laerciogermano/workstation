# agent-worker — pull uniforme (AVD local)

**Por quê:** mesmo processo em servidor e PC de gestor — puxa jobs da API, executa no ADB localhost, reporta complete/fail.  
**Plano:** [`../../docs/plano-implementacao-worker-avd.md`](../../docs/plano-implementacao-worker-avd.md) · **API:** [`../api/README.md`](../api/README.md)  
**Antes:** rodízio só após N turnos idle. **Depois:** ao esvaziar a fila do agente, **troca o slot na hora**; se ainda há pending, drena com claim seguido.  
**Rollback:** pare o worker; `MODE=single`; status pode ficar `ativo` — sleep manual / `device-status`.

**Produção:** API em `http://144.126.154.90` — workers **só no Mac** (AVD local). Unit `connectmax-worker` na VPS permanece disabled (sem KVM). Scripts: [`scripts/start-worker-*.sh`](scripts/) (`API_URL` Contabo).

**Antes → depois:** `API_URL=http://localhost:3000` (API local) → `API_URL=http://144.126.154.90`.  
**Rollback:** scripts/env de volta a `localhost:3000` e subir API local.

## Modos

### Single — 1 agente / 1 AVD

No start chama `POST /agente/:id/enroll` (cria cadastro magro se faltar; bootstrap com **key global**). LinkedIn completa no painel.

```bash
cd vendas/worker
# prod Contabo (padrão dos scripts/):
./scripts/start-worker-alex.sh
./scripts/start-worker-fernando.sh   # AVD Fernando_Breda → emulator-5564

# ou manual / API local:
API_URL=http://144.126.154.90 \
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
| `EXTRACT_MAX_PROFILES` | Fallback se o job não trouxer `maxProfiles` (API manda slots do limite diário; default **10**) |
| `DRY` / `ONCE` / `ALLOW_STUB` | Smoke / stubs |

## Handlers

| `type` | Status |
|--------|--------|
| `extrair_leads` | `login-extract-profiles --device $SERIAL` — `query` + `maxProfiles` do job (limite diário API); `EXTRACT_QUERY` / `EXTRACT_MAX_PROFILES` só fallback; passa `AGENT_ID` p/ reservar candidatos (`status=0`) |

**Antes → depois (extract → Candidatos):** extract sem `AGENT_ID` → só perfil no pool livre (funil por agente não mostrava Elaine etc.) → handler injeta `AGENT_ID` e script faz `POST` conexão `status=0` em Connect. **Rollback:** remova `AGENT_ID` do env em `extrair_leads.mjs`; `connectionStatusFromInviteStatus("connect")` → `null`.

**Antes → depois (`maxProfiles` diário):** env `EXTRACT_MAX_PROFILES` vencia o payload → job `maxProfiles` (slots restantes do `AGENT_EXTRACT_DAILY_LIMIT`) tem prioridade. **Rollback:** `EXTRACT_MAX_PROFILES \|\| payload.maxProfiles` em `extrair_leads.mjs`.

**Antes → depois (multi-AVD):** extract/unread usavam só `device.config` (`ConnectMax_Cam`→`emulator-5554`) mesmo com `SERIAL` do worker → passam `--device` / serial explícito; `start-runtime` prioriza serial alcançável sobre lookup por `provision.name`. **Rollback:** remova `--device` do handler; reverta o prefer-serial em `screen-robot/src/lib/start-runtime.js`.
| `conectar` | `linkedin-connect` (URL do payload; teto diário na API) |
| `verificar_conexoes` | `linkedin-extract-connections --n 20` (lote) → `mark-accepted`; intervalo API `AGENT_CONNECTIONS_INTERVAL_MS` (default **4 h**) |
| `enviar_prospeccao` | `linkedin-message` (`payload.profileUrl` + `payload.message`; persiste `sent` na API) |
| `ler_mensagens` | `linkedin-unread-messages --sync` (Messaging → Unread → abre cada chat → `client_linkedin_message`; `INBOX_MAX_RESULTS` / payload `maxResults`, default 20) |

**Antes → depois (conectar):** stub → spawn `npm run linkedin-connect -- --url … --no-shot`. Página inexistente → job OK + conexão `status=3`/`discardReason` (funil Descartados). Rollback: `conectar: makeStub('conectar')` em `handlers/index.mjs`.

**Antes → depois (enviar_prospeccao):** stub (`ALLOW_STUB=1` → done fake) → spawn `npm run linkedin-message -- --url … --text … --no-shot`. **Rollback:** `enviar_prospeccao: makeStub('enviar_prospeccao')` em `handlers/index.mjs`.

**Antes → depois (ler_mensagens):** só listava Unread (job done sem gravar) → `--sync` resolve URL (`GET /clientes?q=nome`) e chama `listProfileMessages` (persiste sent/received). Pula Sponsored. Exige `PROFILES_API_URL`/`API_URL` + `AGENT_API_KEY`. **Rollback:** remova `--sync` em `handlers/ler_mensagens.mjs` (volta a só listar).

## Contrato host

1. `GET /agente/slots?hostKey=`  
2. `docker start|stop` local  
3. `POST /agente/:id/device-status`  
4. claim → se vazio, rotate on-empty
