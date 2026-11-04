# agent-worker — pull uniforme (AVD ou CDP)

**Por quê:** mesmo processo em servidor e PC de gestor — puxa jobs da API, executa no device local (AVD **ou** Chrome CDP), reporta complete/fail.  
**Plano:** [`../../docs/plano-implementacao-worker-avd.md`](../../docs/plano-implementacao-worker-avd.md) · **API:** [`../api/README.md`](../api/README.md) · **libs CDP:** [`../../../../screen-robot/src/lib/cdp/README.md`](../../../../screen-robot/src/lib/cdp/README.md)  
**Antes:** rodízio só após N turnos idle. **Depois:** ao esvaziar a fila do agente, **troca o slot na hora**; se ainda há pending, drena com claim seguido.  
**Rollback:** pare o worker; `MODE=single`; status pode ficar `ativo` — sleep manual / `device-status`.

**Produção:** API em `http://144.126.154.90` — workers **só no Mac** (AVD/CDP local). Unit `connectmax-worker` na VPS permanece disabled (sem KVM). Scripts: [`scripts/start-worker-*.sh`](scripts/) (`API_URL` Contabo).

**Antes → depois:** `API_URL=http://localhost:3000` (API local) → `API_URL=http://144.126.154.90`.  
**Rollback:** scripts/env de volta a `localhost:3000` e subir API local.

**Antes → depois (runtime CDP):** só AVD (`SERIAL` + handlers ADB) → `WORKER_RUNTIME=cdp` + `CDP_ID`/`CDP_URL` usa `handlers/cdp/` → scripts `linkedin-*-cdp` (mesmo contrato de jobs). **Rollback:** remova `WORKER_RUNTIME`/`CDP_*` e use `SERIAL` + scripts AVD; apague `handlers/cdp/` se precisar.

**Antes → depois (lifecycle Chrome por job):** CDP ficava aberto logado entre jobs → `withLinkedInPage` sobe o Chrome e chama `stopCdp` no fim de cada operação. Escape: `CDP_KEEP_BROWSER=1`. **Rollback:** `CDP_KEEP_BROWSER=1` ou reverta o `finally` em `screen-robot/src/lib/cdp/session.js`.

**Antes → depois (IP ≠ último):** jobs no mesmo egress seguido → worker **fica ligado** e faz poll do IP (`EGRESS_IP_POLL_MS`, default 10s). Se atual == `~/.connectmax/last-egress-ip`, **não claima** (espera mudar). Quando muda, claima/executa, grava o último IP e append em `~/.connectmax/egress-ip-timeline.jsonl` (`at`, `ip`, `previous`, `agentId`, `jobId`, `jobType`). Escape: `SKIP_EGRESS_IP_GUARD=1` / `DRY=1`. Reset último: `rm ~/.connectmax/last-egress-ip` (timeline permanece). **Rollback:** remova o wait/commit em `agent-cycle.mjs` / apague `src/last-egress-ip.mjs`.

**Antes → depois (logs legíveis):** stdout só no arquivo `logs/worker-*.out` (terminal do `keep-worker` quase mudo; espera de IP logava 1× e ficava quieto) → `src/log.mjs` com **data+hora local** (`DD/MM/YYYY HH:MM:SS`, fuso `America/Sao_Paulo` / `WORKER_LOG_TZ`) + mensagens em PT (ciclo, claim, IP, spawn); cada poll de IP loga `consultando IP público #N → url…` e o resultado; scripts CDP fazem `tee -a` (terminal **e** arquivo). Escape: `WORKER_LOG_VERBOSE=0`; `EGRESS_IP_LOG_EVERY` (default `1`) rarefaz só a linha “ainda igual”. **Rollback:** volte `>>"$LOG"` nos `start-worker-*-cdp.sh`; remova imports de `log.mjs` / logs por poll em `last-egress-ip.mjs`.

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

### Single — 1 agente / 1 Chrome CDP

Mesmos jobs; handlers em `handlers/cdp/` (`CDP_ID` / `CDP_URL` no lugar de `SERIAL`).

```bash
cd vendas/worker
# keep-alive (reinicia se o processo morrer — preferível no Mac):
./scripts/keep-worker.sh ./scripts/start-worker-daniela-cdp.sh   # :9255
./scripts/keep-worker.sh ./scripts/start-worker-thiago-cdp.sh    # :9256
./scripts/keep-worker.sh ./scripts/start-worker-juliana-cdp.sh   # :9258
./scripts/keep-worker.sh ./scripts/start-worker-roberto-cdp.sh   # :9259
# one-shot:
./scripts/start-worker-daniela-cdp.sh
./scripts/start-worker-thiago-cdp.sh
./scripts/start-worker-juliana-cdp.sh
./scripts/start-worker-roberto-cdp.sh

# ou:
WORKER_RUNTIME=cdp CDP_ID=daniela-hoffmann \
  AGENT_ID=<uuid|slug> AGENT_API_KEY=… API_URL=http://144.126.154.90 \
  npm start
```

**Claimed órfão:** processo morto no meio do job → API (sweep + heartbeat offline) reabre `pending` em ~3 min; `SIGTERM` tenta `fail` imediato. Ver [`../api/README.md`](../api/README.md) (`AGENT_CLAIM_OFFLINE_MS` / `AGENT_STALE_SWEEP_MS`).

Allowlist via `PATCH /agentes/:id` `{ "procedimentos": ["extrair_leads","conectar",…] }`.  
Daniela/Thiago/Juliana/Roberto: `extrair_leads` + `conectar`. **Antes → depois:** só extract → + conectar. Rollback: `procedimentos: ["extrair_leads"]`.

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
| `EXTRACT_MAX_PROFILES` | Fallback se o job não trouxer `maxProfiles` (API manda `min(EXTRACT_MAX_PROFILES, slots do dia)`; default **5**) |
| `WORKER_RUNTIME` | `cdp` → handlers Chrome; omit/`avd` → AVD |
| `CDP_ID` / `CDP_URL` | Perfil/porta human-cdp (obrigatório no runtime CDP) |
| `DRY` / `ONCE` / `ALLOW_STUB` | Smoke / stubs |
| `SKIP_EGRESS_IP_GUARD=1` | Desliga a guarda de IP repetido |
| `LAST_EGRESS_IP_FILE` | Último IP (default `~/.connectmax/last-egress-ip`) |
| `EGRESS_IP_TIMELINE_FILE` | JSONL da timeline (default `~/.connectmax/egress-ip-timeline.jsonl`) |
| `EGRESS_IP_POLL_MS` | Poll enquanto espera IP mudar (default `10000`) |
| `EGRESS_IP_LOG_EVERY` | A cada N polls loga “IP ainda igual” (default `1` = todas; a linha `consultando IP…` sempre aparece) |
| `EGRESS_IP_URL` | Override do lookup (default `https://api.ipify.org`) |
| `WORKER_LOG_VERBOSE` | `0` silencia debug (heartbeat OK etc.); default ligado |
| `WORKER_LOG_TZ` | Fuso do timestamp (default `America/Sao_Paulo`) |

## Handlers

| `type` | AVD | CDP (`WORKER_RUNTIME=cdp`) |
|--------|-----|------------------------------|
| `extrair_leads` | `login-extract-profiles --device $SERIAL` — `query` + `maxProfiles` do job; `AGENT_ID` reserva `status=0` | `linkedin-extract-leads-cdp -n …` |
| `conectar` | `linkedin-connect` (URL do payload) | `linkedin-connect-cdp` |
| `verificar_conexoes` | `linkedin-extract-connections --n 20` → `mark-accepted` | `linkedin-extract-connections-cdp` |
| `enviar_prospeccao` | `linkedin-message` | `linkedin-message-cdp` |
| `ler_mensagens` | `linkedin-unread-messages --sync` | `linkedin-unread-messages-cdp --sync` |

**Antes → depois (extract → Candidatos):** extract sem `AGENT_ID` → só perfil no pool livre (funil por agente não mostrava Elaine etc.) → handler injeta `AGENT_ID` e script faz `POST` conexão `status=0` em Connect. **Rollback:** remova `AGENT_ID` do env em `extrair_leads.mjs`; `connectionStatusFromInviteStatus("connect")` → `null`.

**Antes → depois (`maxProfiles` diário):** env `EXTRACT_MAX_PROFILES` vencia o payload → job `maxProfiles` (`min(EXTRACT_MAX_PROFILES, slots do dia)`, default **5**/run) tem prioridade. **Rollback:** `EXTRACT_MAX_PROFILES \|\| payload.maxProfiles` em `extrair_leads.mjs`; fallback `10` + `maxProfiles: remaining` na API.

**Antes → depois (multi-AVD):** extract/unread usavam só `device.config` (`ConnectMax_Cam`→`emulator-5554`) mesmo com `SERIAL` do worker → passam `--device` / serial explícito; `start-runtime` prioriza serial alcançável sobre lookup por `provision.name`. **Rollback:** remova `--device` do handler; reverta o prefer-serial em `screen-robot/src/lib/start-runtime.js`.

**Antes → depois (conectar):** stub → spawn `npm run linkedin-connect -- --url … --no-shot`. Página inexistente → job OK + conexão `status=3`/`discardReason` (funil Descartados). Rollback: `conectar: makeStub('conectar')` em `handlers/index.mjs`.

**Antes → depois (enviar_prospeccao):** stub (`ALLOW_STUB=1` → done fake) → spawn `npm run linkedin-message -- --url … --text … --no-shot`. **Rollback:** `enviar_prospeccao: makeStub('enviar_prospeccao')` em `handlers/index.mjs`.

**Antes → depois (ler_mensagens):** só listava Unread (job done sem gravar) → `--sync` resolve URL (`GET /clientes?q=nome`) e chama `listProfileMessages` (persiste sent/received). Pula Sponsored. Exige `PROFILES_API_URL`/`API_URL` + `AGENT_API_KEY`. **Rollback:** remova `--sync` em `handlers/ler_mensagens.mjs` (volta a só listar).

**Antes → depois (fechar app):** jobs deixavam LinkedIn aberto → libs/scripts fazem `closeLinkedInApp` / `force-stop` no `finally` (unread passa `closeApp: false` nos chats do sync). **Rollback:** `closeApp: false` ou remova o `finally` no screen-robot.

## Contrato host

1. `GET /agente/slots?hostKey=`  
2. `docker start|stop` local  
3. `POST /agente/:id/device-status`  
4. claim → se vazio, rotate on-empty
