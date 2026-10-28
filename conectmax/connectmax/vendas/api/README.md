# vendas/api — base de clientes + extract LinkedIn → Postgres

API NestJS: **base canônica** `clientes` + `cliente_linkedin` (extract incluso) + `client_connection_linkedin` + `client_linkedin_message`.

**Umbrella:** [`../../README.md`](../../README.md) · **Visão vendas:** [`../README.md`](../README.md) · **Script extract:** [`../../../screen-robot/src/scripts/login-extract-profiles.js`](../../../screen-robot/src/scripts/login-extract-profiles.js)  
**Arquitetura (C4 + classes + sequências):** [`../../docs/arquitetura.md`](../../docs/arquitetura.md)

---

## Antes → depois

| Antes | Depois |
|-------|--------|
| Extract só grava JSON em `screenshots/login-extract-profiles/` | Com `PROFILES_API_URL`, cada perfil também vai para `POST /profiles` |
| `linkedin_profiles` + `linkedin_profile_details` | Tudo em `cliente_linkedin` (+ `clientes.nome`); rotas `/profiles` e `/profile-details` são fachada |
| Extract separado do CRM | Mesma linha: URL, foto, headline, inviteStatus, soft-delete |
| Sem vínculo agente ↔ cliente LinkedIn | `client_connection_linkedin` + `POST /client-connections-linkedin` (status int 0/1/2/3) |

**Migração de dados:** `npm run migrate:profiles-to-cliente-linkedin` — **apaga soft-deletes** em `linkedin_profiles`, migra só ativos → `cliente_linkedin`, depois `DROP` das tabelas antigas.

**Rollback:** pare a API; no extract, não defina `PROFILES_API_URL` (volta só JSON local). Remova o container: `docker compose down -v` nesta pasta.  
**Rollback (modelo unificado):** restaurar commit anterior + entities Profile; `DROP` colunas novas de `cliente_linkedin` se necessário.

---

## Subir

```bash
# 1) Postgres — Docker (se o daemon estiver up)
docker compose up -d

# ou Homebrew local (sem Docker):
#   createuser -s connectmax  /  createuser -P connectmax
#   createdb -O connectmax connectmax
#   (senha no .env = DB_PASSWORD)

# 2) API
cp .env.example .env
npm install
npm run start:dev
```

Default: `http://localhost:3000`

### Local → base de produção

No `.env` da API (não versionado): `DB_HOST=144.126.154.90` + user/senha/db de produção (`credenciais.md` / VPS). **`DB_SYNC=false`** (nunca synchronize contra prod).

| | Local (Docker/Homebrew) | Produção (VPS 144) |
|--|--|--|
| `DB_HOST` | `localhost` | `144.126.154.90` |
| `DB_SYNC` | `true` ok | **`false`** |

**Antes → depois:** local podia usar Postgres da máquina → agora o `.env` local aponta ao Postgres da VPS 144.  
**Rollback:** `DB_HOST=localhost` (ou `127.0.0.1`), senha do Postgres local, `DB_SYNC=true`; reinicie a API.

CORS liberado (`enableCors({ origin: true })`) para o front em [`../web/README.md`](../web/README.md).  
**Antes → depois:** sem CORS → browser em outra origem consegue `GET /profiles`.  
**Rollback:** remover `app.enableCors(...)` em `src/main.ts`.

Body JSON até `BODY_LIMIT` (default `15mb`) — `photoBase64`+`cardBase64` passam do default Express (~100kb).  
**Antes → depois:** `413 Payload Too Large` no meio do `/extract/start` → aceita payloads grandes.  
**Rollback:** tire `bodyParser: false` + `json({ limit })` em `src/main.ts` (volta ~100kb).

---

## Endpoints

### Base de clientes (`clientes` + `cliente_linkedin`)

Identidade canônica (canal-agnóstica) em `clientes`. Dados de LinkedIn na filha 1:1 `cliente_linkedin`. Outras filhas (WhatsApp, e-mail…) seguem o mesmo padrão depois.

| Tabela | Papel |
|--------|--------|
| `clientes` | nome, e-mail, telefone, empresa, cargo, cidade, notas |
| `cliente_linkedin` | URL, headline, company, foto/capa/card, OCR, inviteStatus, soft-delete (`deleted_at`) — fonte única do extract |
| `client_connection_linkedin` | liga **agente** ↔ `cliente_linkedin`; status int `0` nao_enviado · `1` pendente · `2` conectado |
| `client_linkedin_message` | mensagens **sent/received** por agente ↔ `cliente_linkedin` (upsert por fingerprint) |
| `empresas` | CNPJ, razão social, fantasia, totais pedidos/orçamentos (funil portal + planilhas) |
| `servidores` | Hosts VPS/VDS (IP, SSH, RAM, nested KVM) — ex.: Contabo VDS 24 GB |
| `avds` | Containers docker-avd no servidor (ativo/dormindo, backup tar `/android-home`) |
| `contas_linkedin` | Conta LinkedIn 1:1 com AVD (usuário, senha, foto, infrações) — 1 servidor → N AVDs → 1 conta |

**Antes → depois (unificação):** `linkedin_profiles` / `linkedin_profile_details` → `cliente_linkedin`. IDs de `/profiles/:id` = `cliente_linkedin.id`. Rollback: commit anterior + migrate reverso manual.

**Antes → depois (slug acento):** `normalizeLinkedInProfileUrl` com `[A-Za-z0-9._%-]` cortava `débora-…` → `/in/d` → charset `[^\s/?#]+` em [`linkedin-url.ts`](src/clientes/linkedin-url.ts) (+ espelho em connections). Rollback: charset ASCII.

**Antes → depois (lead global):** upsert podia criar 2ª linha (URL truncada vs full; soft-delete de outro agente) → `findExistingLinkedinForExtract` (URL + prefixo + fuzzy, incl. deleted); convidado/conectado por **qualquer** agente permanece fora de Candidatos; `POST` conexão `status=0` falha com 409 se outro agente já tem 1|2. Rollback: exact-URL-only + `deletedAt: null` cego no upsert.

### Empresas (`empresas`)

Cadastro B2B a partir do funil Conect. Seed: [`../../docs/planilhas-funil/empresas.json`](../../docs/planilhas-funil/empresas.json) via `npm run seed:empresas` (API no ar). Regenerar JSON: `python3 docs/planilhas-funil/build-empresas.py --fetch-portal`.

| Método | Papel |
|--------|--------|
| `GET /empresas` | Lista paginada (`page`, `limit`≤200, `q`, `comCnpj=true\|false`) |
| `GET /empresas/:id` | Detalhe |
| `POST /empresas` | Cria |
| `POST /empresas/import` | Upsert em lote `{ "empresas": [ … ] }` (por CNPJ ou razão sem CNPJ) |
| `PATCH /empresas/:id` | Update parcial |

**Antes → depois:** empresas só no portal/xlsx → tabela + UI `/empresas`.  
**Rollback:** `DROP TABLE empresas;`; remova `EmpresasModule` do `app.module.ts`.

### Agentes (`agentes`)

**Uma linha = host (IP/SSH) + device (container/ADB) + conta LinkedIn.** Não há mais tabelas/UI de `servidores`, `avds` nem `contas_linkedin`. `nome` = agentId (`provision.name`). Gestores têm `agentes:read`/`agentes:write` e, ao criar, são vinculados em `gestor_agentes`.

| Método | Papel |
|--------|--------|
| `GET /agentes` | Lista (`grouped`, `sync`, `q`, `hostKey`, `status`) |
| `POST /agentes` | Cria (host inline ou `copyHostFromAgenteId`; LI opcional; `provisionDevice=false` só cadastro) |
| `PATCH /agentes/:id` | Host / notas / LinkedIn |
| `POST /agentes/sync` | docker ps nos hosts já cadastrados |
| `POST /agentes/:id/sleep\|wake\|ping\|backup` | ops device |
| `DELETE /agentes/:id` | remove container + linha |

Campos host: `hostNome`, `ipPublico` (opcional se `hostKind=gestor`), `localhost`, `hostKind` (`server`\|`gestor`\|`localhost`), SSH, etc. Device: `adbPort`, `containerName`, `status` (`ativo`\|`dormindo`\|…). LinkedIn: `linkedinNome`, `linkedinUsuario`, `linkedinSenha`, `linkedinProfileUrl`, `linkedinHeadline`, `linkedinPhotoBase64`, `linkedinStatus`, `linkedinInfracoes`. Worker: `POST /agentes/:id/api-key`.

```bash
curl -X POST http://localhost:3000/agentes -H 'Content-Type: application/json' \
  -H "Authorization: Bearer <token>" -d '{
  "nome": "agent-f",
  "copyHostFromAgenteId": "<uuid>",
  "linkedinNome": "Agent F",
  "linkedinUsuario": "conta@exemplo.com",
  "linkedinSenha": "…",
  "provisionDevice": true,
  "start": true
}'
```

Env: `AVD_ARTIFACTS_DIR`, `AVD_DEFAULT_IMAGE`.

**Antes → depois:** `servidores` + `avds` + `contas_linkedin` + `vendedores` → `agentes` (vendedor = agente); UI só `/agentes`. Boot (idempotente): migra avds/servidores/LI; `DROP TABLE vendedores`.  
**Rollback:** restaurar módulos/UI antigos no git; recriar `vendedores` se precisar.

### Gestores de vendas (`gestores`)

Não há tabela `gestores`: são **usuários** com role `gestor` (roles são array — pode ser admin+gestor+dev). Ligação: `gestor_agentes` (`gestor_id` → `users.id`, `agent_id` único = `agentes.nome`). Cadastro de agentes: UI `/agentes` (`agentes:write`).

| Método | Papel |
|--------|--------|
| `GET /gestores` | Lista users com role gestor + agentes |
| `GET /gestores/agentes` | Opções de agente p/ formulário |
| `GET /gestores/:id` | Detalhe |
| `PUT /gestores/:id/agentes` | Substitui `agentIds[]` |

**Antes → depois:** tabela `gestores` própria → users.roles + `gestor_agentes`.  
**Rollback:** `DROP TABLE gestor_agentes;`; remova `GestoresModule`; tire role `gestor` / UI.

### Agente — fila de prioridades (`agente`)

Cada AVD/conta (`agentId` = `provision.name`, ex. `agent-d`) puxa o próximo trabalho sozinho. Prioridade fixa (ACs):

| Pri | type | Quando materializa |
|-----|------|--------------------|
| 1 | `ler_mensagens` | Inbox due (`AGENT_INBOX_INTERVAL_MS`, default 15 min) |
| 2 | `verificar_conexoes` | Há pending (`status=1`) e due (`AGENT_CONNECTIONS_INTERVAL_MS`, default 30 min) → listar **20** recentes (`AGENT_CONNECTIONS_CHECK_N`) via perfil → tap `N connections` + `mark-accepted` |
| 3 | `enviar_prospeccao` | Conexão status `2` sem mensagem `sent` |
| 4 | `conectar` | Lead do agente (`status=0`) ou livre (ninguém 0\|1\|2) → reserva `0` + job; máx. `AGENT_CONNECT_DAILY_LIMIT` (default **15**)/dia em lotes de `AGENT_CONNECT_BATCH_SIZE` (default **5**) com pausa `AGENT_CONNECT_BATCH_INTERVAL_MS` (default **2 h**) entre lotes |
| 5 | `extrair_leads` | Leads do agente (livres + `status=0` dele) &lt; `AGENT_LEAD_THRESHOLD` (default 20) |

**Antes → depois (`verificar_conexoes`):** pending→conectado só via robot manual (`POST :3099/connections` / `npm run linkedin-extract-connections`) → mesmo script, agendado no claim (`AGENT_CONNECTIONS_INTERVAL_MS`, default 30 min) quando há `status=1`. Falha também grava `last_connections_at` (backoff). **Rollback:** remova o tipo do worker/`AGENT_JOB_TYPES`; ignore `last_connections_at`; volte a chamar o script/API robot à mão.

Claim: `FOR UPDATE SKIP LOCKED`. Tabelas: `agent_jobs`, `agent_runtime`. Slots: máx. `AVD_MAX_ATIVOS_POR_SERVIDOR` (default **4**) ativos por host.

| Método | Papel |
|--------|--------|
| `POST /agente/:agentId/claim` | Materializa filas + pega 1 job |
| `POST /agente/:agentId/heartbeat` | Presença do worker (`hostInstanceId`, `workerVersion`) → `online` |
| `GET /agente/:agentId/peek` | Contagens pending + próximo + `online` |
| `GET /agente/:agentId/jobs` | Histórico (`status`, `limit`) |
| `GET /agente/:agentId/runtime` | idle/busy, lastInboxAt, `online` |
| `POST /agente/:agentId/jobs/:jobId/complete` | Marca done (+ `lastInboxAt` / `lastConnectionsAt` conforme o tipo) |
| `POST /agente/:agentId/jobs/:jobId/fail` | Marca failed `{ "error": "…" }` |
| `GET /agente/slots` | Por host: ativos/dormindo, `candidatosWake`/`candidatosSleep`, serial/container (supervisor) |
| `POST /agente/:agentId/device-status` | Sync status `ativo`\|`dormindo` após docker local (sem SSH) |
| `POST /agentes/:id/api-key` | Emite `X-Api-Key` do worker (plain uma vez; hash no banco) |

```bash
# chave por agente (recomendado) ou X-Api-Key global AGENT_API_KEY
curl -X POST http://localhost:3000/agentes/<uuid>/api-key -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/agente/agent-d/heartbeat \
  -H "X-Api-Key: $AGENT_API_KEY" -H 'Content-Type: application/json' \
  -d '{"hostInstanceId":"dev-1","workerVersion":"0.1.0"}'
curl -X POST http://localhost:3000/agente/agent-d/claim -H "X-Api-Key: $AGENT_API_KEY"

# worker (F2): extrair_leads real; outros ALLOW_STUB=1
cd ../worker && DRY=1 ONCE=1 AGENT_ID=agent-d AGENT_API_KEY=… npm start
```

Auth worker: JWT, `AGENT_API_KEY` global **ou** chave emitida em `POST /agentes/:id/api-key` (escopo só daquele `agentId`). Campos: `agentes.api_key_hash`, `agentes.host_kind`, `agent_runtime.last_heartbeat_at` (+ instance/version). Offline se heartbeat &gt; `AGENT_HEARTBEAT_STALE_MS` (default 120s).

**Antes → depois:** loop dry → [`../worker/README.md`](../worker/README.md) pull + heartbeat + key por agente.  
**Rollback:** ignore colunas novas; use só `AGENT_API_KEY` global; `DROP` colunas `api_key_hash` / heartbeat se quiser.

**Antes → depois (AC-04 leads):** Candidatos globais (sem 1\|2) → **livres (ninguém 0\|1\|2) + reservados `status=0` do agente** (worker/`countLeads`). Rollback: `NOT EXISTS … status IN (1,2)` global.

**Antes → depois (funil `?agentId=`):** `GET /profiles?agentId=` misturava **pool livre** (igual em todos os agentes) + reservados → **só `status=0` daquele agente** (sem repetir leads livres). Worker continua claimando o pool livre. Rollback: `OR NOT EXISTS (… status IN (0,1,2))` em `buildActiveLinkedinQuery`.

**Antes → depois (AC-03 / ownership):** dois agentes podiam pegar o mesmo perfil → ao conectar, **reserva `NOT_SENT`**; se outro já tem 0\|1\|2, pula; unique parcial `UQ_ccl_one_active_owner`. Rollback: dropar o índice; listar só sem 1\|2; upsert 409 só em 1\|2.

**Antes → depois (fila Candidatos):** 1º de `GET /profiles` global → **1º lead do agente** (já `0`) ou próximo livre claimado; `GET /profiles?agentId=` no funil. Rollback: `listCandidatosLivres` sem filtro 0.

**Antes → depois (lotes connect):** limite diário contínuo (default 10) → **15/dia**, **5** por lote, pausa **2 h** após cada múltiplo de 5 (`invitedAt` do último do lote). Peek: `connectBatchSize`, `connectBatchIntervalMs`, `connectSlotsNow`. Rollback: `AGENT_CONNECT_DAILY_LIMIT=10`, `BATCH_SIZE=15` (ou omitir batch = defaults antigos via env `BATCH_SIZE=999` + intervalo baixo); ou reverter `connectSlotsNow`/`enqueueConectar`.

**Antes → depois (subset de jobs):** todos os tipos → `AGENT_MATERIALIZE_TYPES` (csv; vazio = todos). Ex. teste connect: `verificar_conexoes,conectar` — cancela pending dos demais e claim só desses. Flag extra: `AGENT_ENVIAR_PROSPECCAO_ENABLED=0` só quando a lista está vazia. Rollback: unset `AGENT_MATERIALIZE_TYPES`.

#### `GET /clientes`

Lista paginada (com `linkedin` se existir). Query: `page`, `limit` (máx. 100), `q`.

```bash
curl 'http://localhost:3000/clientes?page=1&limit=50&q=comprador'
```

#### `POST /clientes`

Cria cliente; `linkedin` opcional no mesmo body.

```json
{
  "nome": "Alexandre Silva",
  "email": null,
  "telefone": null,
  "empresa": "Grupo GPS",
  "cargo": "Comprador",
  "cidade": "Belo Horizonte",
  "notas": null,
  "linkedin": {
    "profileUrl": "https://www.linkedin.com/in/…",
    "headline": "Comprador at Grupo GPS",
    "linkedinProfileId": null
  }
}
```

#### `GET /clientes/:id` · `PATCH /clientes/:id`

Detalhe (com relação `linkedin`) e update parcial dos campos canônicos.

#### `GET /clientes/:id/linkedin` · `PUT /clientes/:id/linkedin`

Lê / upsert da filha LinkedIn. No PUT, `null` no body **não** apaga valor já salvo (merge).

**Antes → depois:** CRM inexistente → `clientes` como hub; LinkedIn vira canal, não a identidade.  
**Rollback:** ver seção Antes → depois no topo.

---

### Conexões LinkedIn (`client_connection_linkedin`)

**Regra:** conexão **obriga** `cliente_linkedin` + `cliente` vivos. Soft-delete de candidato (`deleted_at`) **não** se aplica a quem já está pendente (1) ou conectado (2); match que soft-deleta duplicatas também os ignora. `GET` de conexões revive soft-deletes indevidos; `DELETE /profiles/:id` → `409` se houver conexão 1|2. Remover candidato também marca `status=0` como **descartado (3)** (`discard_reason=candidato removido`) — evita órfão que inflava KPI “Sem convite” vs coluna Candidatos.

**Antes → depois:** match soft-deletava o próprio perfil da conexão (ex.: leomarques 404 com conexão ativa) → exclusão só de candidatos sem conexão; Remover bloqueado; listagens usam `INNER JOIN` em cliente. **Rollback:** volte soft-delete sem filtro `NOT EXISTS` / `leftJoin` e remova `reviveConnectedSoftDeleted`.

### Conexões LinkedIn — endpoints

Relaciona um **agente** nosso (`agentId`, ex. `provision.name`) com um `cliente_linkedin`. Unique `(cliente_linkedin_id, agent_id)`.

| status (int) | Significado |
|--------------|-------------|
| `0` | não enviado (fila) |
| `1` | pendente (convite enviado) |
| `2` | conectado (aceito) |

#### `GET /client-connections-linkedin`

Query: `page`, `limit`, `agentId`, `status` (`0`\|`1`\|`2`).

```bash
curl 'http://localhost:3000/client-connections-linkedin?agentId=ConnectMax_Cam&status=0'
```

#### `POST /client-connections-linkedin`

Upsert. Resolve `cliente_linkedin` por `clienteLinkedinId` **ou** `profileUrl`. Se a URL ainda não existir → cria `clientes` + `cliente_linkedin` (`peerName`/`nome` opcional; senão slug). Callback do `linkedin-connect` após Pending → `status: 1`. Perfil inexistente (“This page doesn't exist”) → `status: 3` + `discardReason` (soft-delete do card em Candidatos; funil **Descartados**).

**Antes → depois (descartados):** só 0/1/2 → `3` + coluna `discard_reason`; OCR 404 falhava o job → completa e move o card. **Rollback:** ignore `status=3` / coluna; volte `hasPageDoesNotExist` a `ok: false` sem POST.

```json
{
  "profileUrl": "https://www.linkedin.com/in/…",
  "agentId": "ConnectMax_Cam",
  "status": 1,
  "peerName": "Bruno Toyomoto",
  "invitedAt": "2026-10-23T12:00:00.000Z",
  "steps": ["view:…", "connect@…", "skip@…", "pending:try1"]
}
```

**Antes → depois:** 404 se sem `cliente_linkedin` → auto-cria. **Rollback:** restaurar `NotFoundException` em `resolveClienteLinkedinId`.

#### `POST /client-connections-linkedin/mark-accepted`

Callback do robot após listar N conexões recentes. Cruza `connections[].name` (OCR) com convites `status: 1` do `agentId` via `clientes.nome` (normalizado) e promove matches a `status: 2`.

```json
{
  "agentId": "ConnectMax_Cam",
  "connections": [
    { "name": "Ana Silva", "title": "Buyer at …", "connectedOn": "October 23, 2026" }
  ]
}
```

Resposta: `{ ok, pendingChecked, updated: [{ id, name, profileUrl, … }], unmatched: ["…"] }`.

**Antes → depois:** só Pending via connect → também marca aceitos pela lista Connections.  
**Rollback:** ignore `mark-accepted` no robot; `DROP TABLE client_connection_linkedin;` e remova `ClientConnectionsLinkedinModule` do `app.module.ts`.

---

### Mensagens LinkedIn (`client_linkedin_message`)

Histórico de mensagens enviadas/recebidas. Unique `(cliente_linkedin_id, agent_id, fingerprint)`.

| Campo | Papel |
|-------|--------|
| `direction` | `sent` \| `received` |
| `message` | texto |
| `sender` | nome no chat |
| `time_label` | rótulo da UI (`8:47 AM`) |
| `occurred_at` | instante (envio nosso = now) |
| `fingerprint` | `direction` + texto normalizado (sem acento/case/espaços) |

Varredura (`messages[]`): **upsert** por sentido+texto; lote grava `occurredAt` sequencial (antigo→novo) p/ o front. "oi" sent ≠ "oi" received.

Se `cliente_linkedin` não existir para a `profileUrl`, cria `clientes` + `cliente_linkedin` (nome = `peerName` ou slug).

#### `GET /client-linkedin-messages`

Query: `page`, `limit`, `agentId`, `profileUrl`, `clienteLinkedinId`, `direction`.

```bash
curl 'http://localhost:3000/client-linkedin-messages?profileUrl=https://www.linkedin.com/in/laerciogermano'
```

#### `POST /client-linkedin-messages`

Envio (1 item) ou leitura (lote). Callback do screen-robot após `POST /message` e `POST /profile-messages`.

**Regra de envio:** item único com `direction: "sent"` só grava se existir `client_connection_linkedin` do mesmo `agentId` + perfil com **`status: 2` (conectado)**. Caso contrário → `403 Forbidden`. Lote `messages[]` (leitura do chat) **não** exige aceite; ao gravar lote/`received`, a API promove (ou cria) a conexão para `status: 2`.

```json
{
  "profileUrl": "https://www.linkedin.com/in/laerciogermano",
  "agentId": "ConnectMax_Cam",
  "direction": "sent",
  "message": "Perfeito, Laércio. Vou te enviar por email"
}
```

```json
{
  "profileUrl": "https://www.linkedin.com/in/laerciogermano",
  "agentId": "ConnectMax_Cam",
  "peerName": "Laércio Germano",
  "messages": [
    { "direction": "received", "message": "Opa", "sender": "Laércio Germano", "time": "8:49 AM" },
    { "direction": "sent", "message": "oi", "sender": "Matheus ConectMax", "time": "8:47 AM" }
  ]
}
```

**Antes → depois:** fingerprint `direction|time|raw` (duplicava na re-leitura) → corpo normalizado + merge/delete irmãos.  
**Antes → depois (envio):** qualquer `sent` único gravava → exige conexão aceita (`status: 2`); UI `/mensagens` e robot `POST /message` também bloqueiam.  
**Rollback:** remover `assertConnectionAccepted` em `client-linkedin-messages.service.ts` (+ check no robot/`mensagens.jsx`); unset `PROFILES_API_URL` no robot; ou `DROP TABLE client_linkedin_message`.

---

### Listagem unificada (`/linkedin-base`)

Consulta a base de **conexões** + **mensagens** num único prefixo.

| Método | Papel |
|--------|--------|
| `GET /linkedin-base` | `{ ok, connections, messages }` (ambos paginados) |
| `GET /linkedin-base/connections` | só `client_connection_linkedin` |
| `GET /linkedin-base/messages` | só `client_linkedin_message` |

Query comum: `page`, `limit`, `agentId`, `profileUrl`.
Conexões: também `status` (`0`\|`1`\|`2`). Mensagens: também `direction` (`sent`\|`received`).

Na listagem de **conexões**, se `cliente_linkedin.photoBase64` estiver vazio, a API preenche na resposta (sem persistir) a partir de `linkedin_profile_details` / `linkedin_profiles` — URL exata, prefixo de slug (`bruno-toyomoto-*`) ou nome. Assim o funil (Convidados/Conectados) mostra avatar quando o perfil já foi extraído.

```bash
curl 'http://localhost:3000/linkedin-base?profileUrl=https://www.linkedin.com/in/laerciogermano'
curl 'http://localhost:3000/linkedin-base/connections?agentId=ConnectMax_Cam&status=1'
curl 'http://localhost:3000/linkedin-base/messages?profileUrl=https://www.linkedin.com/in/laerciogermano&direction=sent'
```

Aliases legados: `GET /client-connections-linkedin`, `GET /client-linkedin-messages`.

**Antes → depois:** listagens só nos paths longos → `/linkedin-base` unificado.  
**Antes → depois (avatar conexões):** `photoBase64` só se gravado no `cliente_linkedin` → enrich na resposta via profiles/details.  
**Rollback:** remova `LinkedinBaseModule` do `app.module.ts`; no enrich, remova `enrichClienteLinkedinPhotos` em `ClientConnectionsLinkedinService.findAll`.

---

### `GET /profiles`

Lista paginada de `linkedin_profiles` **ativos** (`deleted_at IS NULL`) — últimos primeiro (`COALESCE(extractedAt, createdAt)` DESC).

Query: `page` (default `1`), `limit` (default `100`, máx. `100`), `q` (busca em name/title/city/current/connection).

Cada item pode trazer `profileUrl` (de `linkedin_profile_details`) quando existir.  
Lista **não** inclui `cardBase64` nem `rawOcr` (só no `GET /profiles/:id`) — evita payload de dezenas de MB.

### `DELETE /profiles`

Soft-delete de **todos** os candidatos ativos: seta `deleted_at = now()` (linha permanece no Postgres). Reextrair / `ensure` revive (`deleted_at = null`).

```bash
curl -X DELETE http://localhost:3000/profiles
# → { "deleted": 3179, "at": "2026-…" }
```

### `DELETE /profiles/:id`

Soft-delete de **um** candidato ativo (`deleted_at = now()`) + descarta conexões `status=0` desse perfil (e órfãos `0` de outros soft-deletes). 404 se já estava soft-deleted ou inexistente. Same revive: reextrair / `ensure` (perfil); conexão fica em `3` até novo claim.

```bash
curl -X DELETE http://localhost:3000/profiles/<uuid>
# → { "id": "<uuid>", "deleted": true, "at": "2026-…" }
```

**Antes → depois:** só massa (`DELETE /profiles`) ou apagar linha → também dá para remover um perfil na UI/API.
**Antes → depois (órfão funil):** soft-delete só setava `deleted_at` e deixava `client_connection_linkedin.status=0` → dashboard “Sem convite” > lista Candidatos → agora descarta `0→3` e o dashboard só conta conexões com `cliente_linkedin.deleted_at IS NULL`.
**Rollback:** `UPDATE linkedin_profiles SET deleted_at = NULL WHERE id = '<uuid>';` e remova `@Delete(':id')` / `softDeleteOne`. Órfãos: `UPDATE client_connection_linkedin SET status=0, discard_reason=NULL WHERE discard_reason='candidato removido';` + remova join `deletedAt` em `DashboardService.activeConnections`.

```json
{
  "meta": { "total": 42, "page": 1, "limit": 100, "pages": 1 },
  "data": [ { "id": "...", "name": "...", "profileUrl": "https://…" } ]
}
```

```bash
curl 'http://localhost:3000/profiles?page=1&limit=100'
curl 'http://localhost:3000/profiles?q=comprador&page=1'
```

**Antes → depois:** lista inteira → paginação + `q` + `profileUrl` na página.  
**Antes → depois (payload):** lista com `cardBase64`/`rawOcr` (~99 MB/100) → só campos de card + `photoBase64` (~1–2 MB).  
**Antes → depois (ordem):** `extractedAt` DESC (NULLs no topo) → `COALESCE(extractedAt, createdAt)` DESC.  
**Rollback:** `findAll` sem `page`/`limit`/`q`; voltar a `getMany()` sem `select`; ordem antiga.
### `GET /profiles/ensure?url=`

Resolve ou cria stub de card + detail a partir de URL `linkedin.com/in/…` (sem disparar extract). Query `url` ou `profileUrl`. Resposta `{ id, profileUrl, created }`. Usado pelo funil ao abrir cards de Convidados/Conectados/Abordados/Respondidos.

```bash
curl 'http://localhost:3000/profiles/ensure?url=https://www.linkedin.com/in/laerciogermano'
```

**Antes → depois:** ensure só via `GET /extract/by-url/start` (já dispara OCR) → ensure puro para navegar ao perfil.  
**Rollback:** remova rota `ensure` no `ProfilesController`.

### `GET /profiles/:id`

Um perfil de `linkedin_profiles` (404 se não existir). Usado pelo web em deep-link `/profiles/:id`.

```bash
curl http://localhost:3000/profiles/<uuid>
```

**Antes → depois:** só lista → também detalhe por id.  
**Rollback:** remover `findOne` no controller/service.

### `POST /profiles`

Um perfil (formato do `profileRow` do extract):

```json
{
  "name": "Alexandre Silva",
  "title": "Comprador/Planejador / ...",
  "searchQuery": "Comprador",
  "level": "2nd",
  "connection": "Pending",
  "city": "Belo Horizonte, Minas",
  "mutualConnections": "2 mutual connections",
  "current": "Comprador at Grupo GPS",
  "past": null,
  "photoBase64": "<png avatar>",
  "cardBase64": "<png card inteiro>",
  "rawOcr": { "elements": [{ "text": "…", "x": 0, "y": 0 }] },
  "extractedAt": "2026-10-13T19:00:00.000Z",
  "round": 1
}
```

`searchQuery`: 1ª palavra do cargo (p/ `login-extract-profile-detail`: nome + searchQuery + 1ª palavra da cidade).

**Dedup / upsert**

1. Hit exact em `(name, current)` → merge (update por `id`)
2. Senão fuzzy: candidatos por tokens do nome + score `0.75*name + 0.25*current` (normalize NFD/acentos). Merge se `matchScore >= 0.88` e `nameSimilarity >= 0.85`
3. Senão insert via upsert clássico em `(name, current)`

Merge: valor novo não-nulo sobrescreve; `null` no body **não** apaga o que já existe.

| Env | Default | Efeito |
|-----|---------|--------|
| `PROFILE_MATCH_SCORE_MIN` | `0.88` | limiar do score composto |
| `PROFILE_NAME_SCORE_MIN` | `0.85` | limiar mínimo do nome |

**Antes → depois:** dedup só por igualdade `(name, current)` → fuzzy + merge automático (OCR/acentos).  
**Rollback:** `PROFILE_MATCH_SCORE_MIN=1` (e/ou `PROFILE_NAME_SCORE_MIN=1`) desliga o fuzzy; só exact + upsert.

**Antes → depois (match extract / stub):** skip por nome forte sozinho em stub vazio via levenshtein com espaço (`Samuel Lopes`≈`Samuelslopes` 0.91) → exige compact≥0.9 (ou score c/ cargo/cidade); stub `ensure` com hífens vira Title Case. Rollback: `candidateNameSimilarity` / `connectionCandidateMatch` / `stubNameFromLinkedInUrl` anteriores.

**Antes → depois (nome com meio):** `nameTokens` pegava os 2 primeiros (`Cristiane Simões…` → LIKE `%simoes%`, não achava `Cristiane Carvalho`) → primeiro+último; `candidateNameSimilarity` trata mesmo 1º+último com meio opcional (~0.96). Rollback: `slice(0,2)` + sem regra first+last.

**Antes → depois (slug id):** stub/`stripNameNoise` só tiravam `^\d{5,}$` → também `6bb660189` (alfanumérico). Rollback: só dígitos puros.


**Antes → depois:** sem `searchQuery` → campo no POST/tabela.  
**Antes → depois (mídia/OCR lista):** só texto → `photoBase64` + `cardBase64` + `rawOcr`. Colunas `photo_base64` / `card_base64` / `raw_ocr`. Rollback: ignore.

### `POST /profiles/batch`

```json
{ "profiles": [ { "name": "..." }, ... ] }
```

### `POST /profile-details`

Detalhe da página do perfil (script `login-extract-profile-detail`). Upsert por `profileId`.

```json
{
  "profileId": "uuid-de-linkedin_profiles",
  "name": "Aline Emanuelle Fonseca",
  "company": "Rede Mater Dei\nRede Mater Dei de Saúde",
  "headline": "…",
  "location": "Belo Horizonte, Minas Gerais, Brazil",
  "connections": "235 connections",
  "mutualConnections": "Marcello and Marcello are mutual connections",
  "canConnect": true,
  "canMessage": true,
  "inviteStatus": "pending",
  "profileUrl": "https://www.linkedin.com/in/…",
  "connectionDegree": "2nd",
  "about": "…",
  "experience": "…",
  "education": "…",
  "skills": "…",
  "photoBase64": "<png base64 do avatar>",
  "coverBase64": "<png base64 da capa>",
  "cardBase64": "<png base64 do card-00 inteiro>",
  "rawOcr": { "elements": [] },
  "extractedAt": "2026-10-21T18:00:00.000Z"
}
```

**Antes → depois (cabeçalho):** só name/headline/location → também `company`, `connections`, `mutualConnections`, `canConnect`/`canMessage`.  
**Antes → depois (inviteStatus):** sem status de convite → `inviteStatus` (`connect`|`pending`|`connected`) + sync de `headline`/`connections` no card pai. Rollback: ignore o campo / remova coluna `invite_status`.  
**Antes → depois (mídia):** sem imagem → `photoBase64` + `coverBase64` + `cardBase64` (crop do `card-00.png`). Rollback: ignore os campos.  
**Antes → depois (re-extração):** POST apagava campos com `null` → merge: só valores não-nulos sobrescrevem; espelha `photoBase64`/nome/cidade/`extractedAt` em `linkedin_profiles` p/ avatar na lista. Rollback: `Object.assign` cego + sem `syncParentProfile`.  
**Antes → depois (lista):** `GET /profiles` só anexava `profileUrl` → também prefere `photoBase64` / `coverBase64` do detail quando existir. Rollback: select só `profileUrl`.

**Antes → depois (capa no card):** sem `cover_base64` em `linkedin_profiles` → coluna + sync do detail + enrich na lista. Rollback: ignore `coverBase64`.

### `GET /profile-details`

Envelope `{ meta: { total }, data }` — tabela `linkedin_profile_details`.

### `GET /profile-details?hasUrl=1`

Só detalhes com `profileUrl` preenchida (LinkedIn `/in/…`).

```bash
curl 'http://localhost:3000/profile-details?hasUrl=1'
open 'http://localhost:3000/profile-details?hasUrl=1'
```

**Antes → depois:** listava todos → filtro opcional `hasUrl=1|true`. Rollback: omita o query param.

### `GET /profile-details/by-url?url=`

Existe detail com esta URL? **1:1** (`profile_url` unique parcial). Resposta `{ exists, profileUrl, profileId, detailId }`.

```bash
curl 'http://localhost:3000/profile-details/by-url?url=https://www.linkedin.com/in/…'
```

**Antes → depois:** mesma URL podia repetir em vários details → índice único + upsert reusa o canônico da URL.  
**Rollback:** `DROP INDEX uq_linkedin_profile_details_profile_url;` e remova `by-url` / lookup por URL no upsert.

### `GET /client-connections-linkedin/match`

Match por score (nome/cargo/cidade/empresa) contra **conexões + linkedin_profiles ativos** (`deleted_at IS NULL`) **+ details** cujo parent não está soft-deleted. Extract usa antes de abrir o card (não olha Connect/Pending na UI). Se bater conexão **pendente (1) ou conectado (2)**, soft-delete dos candidatos ativos equivalentes (saem de Candidatos). Nome tolera slug (`870ab9315`), pronome (`Ela/Dela`) e OCR (`Lusi`↔`Luís`).

```bash
curl 'http://localhost:3000/client-connections-linkedin/match?name=Bárbara%20Oliveira&title=Comprador'
# → matched + source=profile|connection|detail
```

**Antes → depois:** só conexões + nome rígido → também profiles/details; nome com noise/OCR. Rollback: remova busca em `profiles`/`details` e volte `nameSimilarity` puro.

### `GET /profile-details/:profileId`

Um detalhe pelo `profile_id`.

**Antes → depois:** só cards da lista (`linkedin_profiles`) → também detalhe da página aberta.  
**Rollback:** remova `ProfileDetailsModule` / entity; script só JSON local se não POST.

### `GET /dashboard`

Insights de operação (KPIs + séries Recharts + tabelas) sobre `cliente_linkedin` + `client_connection_linkedin`. Sem blobs/OCR/foto/cobertura.

```json
{
  "kpis": [
    { "group": "funil", "label": "Perfis na base", "value": 49, "hint": "total ativos" },
    { "group": "funil", "label": "Sem convite", "value": 41, "hint": "84% · ainda não convidados" },
    { "group": "funil", "label": "Aguardando aceite", "value": 6, "hint": "12% · convite enviado" },
    { "group": "funil", "label": "Conectados", "value": 2, "hint": "4% · aceitaram o convite" }
  ],
  "byInviteStatus": [{ "label": "conectado", "count": 2, "pct": 4 }],
  "byConnStatus": [{ "label": "pendente", "count": 6, "pct": 50 }],
  "byDegree": [{ "label": "2nd", "count": 10, "pct": 20 }],
  "byCity": [{ "label": "Campinas…", "count": 3 }],
  "byTitle": [{ "label": "Comprador", "count": 5 }],
  "byCompany": [{ "label": "Oba…", "count": 2 }],
  "byDayExtract": [{ "label": "2026-10-23", "count": 8 }],
  "byDayConnected": [{ "label": "2026-10-23", "count": 1 }],
  "byDayInvited": [{ "label": "2026-10-23", "count": 3 }],
  "byAgent": [{
    "agentId": "avd-01",
    "name": "Maria",
    "status": "ativo",
    "linkedinStatus": "ativa",
    "notSent": 10,
    "pending": 3,
    "connected": 2,
    "total": 15,
    "lastHeartbeatAt": "2026-10-28T12:00:00.000Z",
    "runtimeStatus": "idle"
  }],
  "recent": [{ "id": "…", "name": "…", "title": "…", "inviteStatus": "connect", "when": "…" }]
}
```

```bash
curl http://localhost:3000/dashboard
```

**Antes → depois:** front agregava `GET /profiles` + `GET /profile-details` → `GET /dashboard` já montado.
**Antes → depois (foco):** `coverage` / foto / OCR / experience / outreach / `missingDetail` / `byRound` → % conectados/pendentes, conexões por dia (`connected_at`/`invited_at`), cargos (`byTitle`), cidades, empresas, tabelas.
**Antes → depois (invite_status):** valores OCR tipo `Connect` apareciam no dashboard → só 3 buckets (`connect`/`pending`/`connected` = não enviado/pendente/conectado); gravação passa por `normalizeInviteStatus` (`clientes/invite-status.ts`).
**Antes → depois (soft-delete):** só ativos (`deleted_at IS NULL`).
**Antes → depois (KPIs):** cards misturavam `%` e “Conexões aceitas” (tabela do agente) com “Conectados” (invite do perfil) → grupo `funil` com valor = **número absoluto**, `%` só no `hint`. Web: seção “Funil de convites”.
**Antes → depois (KPIs hoje):** havia grupo `hoje` (Extraídos / Convites enviados / Aceites do dia) → removido; só `funil`. Volume diário continua em `byDayExtract` / `byDayInvited` / `byDayConnected`. **Rollback:** reinsira os 3 KPIs `group: 'hoje'` + counts `connectedToday`/`invitedToday`/`extractedToday` no `DashboardService` e a seção “Hoje” em `dashboard.jsx`.
**Antes → depois (por agentes):** dashboard só global → `byAgent[]` (funil 0|1|2 + `lastHeartbeatAt`/`runtimeStatus` de `agent_runtime` + cadastro `agentes`). Web: cards + barra empilhada + tabela. **Rollback:** remova `byAgent` do service/módulo e a seção “Por agentes” no web.
**Antes → depois (fonte do funil):** KPIs Sem convite / Aguardando / Conectados + `byInviteStatus` liam `cliente_linkedin.invite_status` (OCR, podia ficar em `connect` após convite) → contam `client_connection_linkedin.status` 0|1|2 (igual coluna Candidatos / Convidados / Conectados do funil). **Rollback:** volte os `getCount`/`groupBy` em `li.inviteStatus` no `DashboardService`.
**Antes → depois (funil sem soft-deleted):** counts de conexão não filtravam `cliente_linkedin.deleted_at` → órfão `status=0` após Remover → agora `activeConnections()` exige perfil ativo. **Rollback:** `connections.count({ where: { status } })` sem join.
**Rollback:** restaure o `DashboardService` anterior (com `coverage`/`withPhoto`/`withOcr`); no web, volte os painéis Radar/cobertura; remova `normalizeInviteStatus` nos upserts. Para KPIs: volte `value` em `%` e o card “Conexões aceitas”; no web, um único `.kpi-grid` sem `group`.

```bash
# 1 perfil da base → LinkedIn → POST
cd screen-robot/src
PROFILES_API_URL=http://localhost:3000 npm run login-extract-profile-detail -- --id <uuid>
```

### `GET /extract/start`

Dispara `npm run login-extract-profiles -- --max-profiles N [--query termo]` em `EXTRACT_CWD` (fire-and-forget). Query `limit`/`n`/`maxProfiles` (default **10**, máx. 500); `q`/`query`/`search` = termo do Search LinkedIn (omitido → script usa `comprador`). Resposta `{ running, kind, pid, startedAt }`. Já rodando → `409`.

```bash
curl 'http://localhost:3000/extract/start?limit=50'
curl 'http://localhost:3000/extract/start?limit=50&q=tech%20recruiter'
```

**Antes → depois:** default 50 → **10**; `?limit=` sobrescreve (máx. 500); termo fixo no robô → `?q=`. **Rollback:** default 50 em `extract.service` / worker `extrair_leads`.

### `GET /extract/detail/start?id=<uuid>`

Dispara `npm run login-extract-profile-detail -- --id <uuid>` (1 perfil da base → página LinkedIn → `POST /profile-details`).

```bash
curl "http://localhost:3000/extract/detail/start?id=<uuid>"
open "http://localhost:3000/extract/detail/start?id=<uuid>"
```

Sem `id` → `400`. Já rodando → `409`.

**Antes → depois:** detalhe só CLI → também via URL com query `id`.  
**Rollback:** use só o CLI; remova a rota `detail/start`.

### `GET /extract/by-url/start?url=`

Recebe URL `linkedin.com/in/…` → garante card na base (stub se novo) → dispara `login-extract-profile-detail --id … --from-profile --url …` (deep link no AVD → OCR cartão: avatar, nome, empresa, local, conexões → `POST /profile-details` + sync no card). Query `url` ou `profileUrl`. Resposta inclui `profileId`, `profileUrl`, `created`, `running`, `pid`.

```bash
curl 'http://localhost:3000/extract/by-url/start?url=https://www.linkedin.com/in/laerciogermano'
# poll
curl http://localhost:3000/extract/status
```

URL inválida → `400`. Já rodando → `409`. Requer AVD + `EXTRACT_CWD` (screen-robot).

**Antes → depois:** extract de detalhe só por `id` → também por URL (cria stub se necessário).  
**Rollback:** remova rota `by-url/start` + `ensureForLinkedInUrl` / `startByUrl`.

### `POST /extract/fails`

Robô reporta cards skipados por **já existirem** na base (só padrão People). Corrobora saturação da busca: muitos `fails` → query genérica demais.

```bash
curl -X POST http://localhost:3000/extract/fails \
  -H 'content-type: application/json' \
  -d '{"viewportFails":3}'
# ou total absoluto: {"fails":12}
# query: POST /extract/fails?viewportFails=3
```

Resposta = `GET /extract/status` (inclui `fails`, `lastViewportFails`). `GET /extract/start` zera os contadores.

**Antes → depois:** status sem sinal de saturação → `fails` / `lastViewportFails`.  
**Rollback:** remova rota `POST /extract/fails` e campos no status.

### `GET /extract/status`

`{ running, kind, profileId, profileUrl, pid, startedAt, exitCode, lastError, fails, lastViewportFails }`.

**Antes → depois:** extract só via CLI no `screen-robot` → também via URL na API.  
**Rollback:** não chame `/extract/*`; use só o CLI. Remova `ExtractModule` do `app.module.ts` se quiser tirar o endpoint.

---

## Extract → API

```bash
# via URL (API já up)
curl http://localhost:3000/extract/start

# ou CLI (cwd: screen-robot/src)
PROFILES_API_URL=http://localhost:3000 npm run login-extract-profiles
```

Sem `PROFILES_API_URL` no CLI, o script não chama a API (só arquivos locais). O endpoint `/extract/start` sempre passa a URL (default `http://127.0.0.1:$PORT`).

---

## Auth (JWT + RBAC)

Todas as rotas exigem `Authorization: Bearer <jwt>` **ou** `X-Api-Key` (global `AGENT_API_KEY` = admin, **ou** chave por agente = só `/agente/:agentId/*` daquele id).

| Role | Acesso |
|------|--------|
| `admin` | tudo (`*`), incl. `users`, `agentes` |
| `dev` | CRM + infra `agentes` |
| `gestor` | leitura CRM + gestores |
| `operador` | CRM (profiles, conexões, mensagens, empresas, gestores, extract, agentes) |
| `viewer` | só leitura do CRM/dashboard |

| Método | Papel |
|--------|--------|
| `POST /auth/login` | `{ email, password }` → `{ accessToken, user }` (**público**) |
| `GET /auth/me` | usuário atual + permissions |
| `GET/POST/PATCH/DELETE /users` | CRUD usuários (só admin); UI: SPA `/usuarios` |

**Antes → depois (remover usuário):** só desativar via PATCH → `DELETE /users/:id` (hard-delete; bloqueia a própria conta; `gestor_agentes` cascateia). **Rollback:** remova o endpoint + botão Remover em `usuarios.jsx`.

Usuário tem **`roles` jsonb** (várias ao mesmo tempo). Seed: admin com `roles: ["admin"]`. Coluna antiga `role` → migrar: `ALTER TABLE users ADD COLUMN roles jsonb DEFAULT '["viewer"]'; UPDATE users SET roles = jsonb_build_array(role); ALTER TABLE users DROP COLUMN role;`

**Antes → depois:** API aberta na internet → login obrigatório + permissões por role.  
**Rollback:** remova `AuthModule` / guards; `DROP TABLE users;`; tire proxy `/auth` `/users` do nginx; no front, volte `main.jsx` sem gate de login.

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@connectmax.local","password":"ChangeMeAdmin!2026"}'
# use o accessToken:
curl -s http://localhost:3000/profiles -H "Authorization: Bearer <token>"
# agentes:
curl -s -X POST http://localhost:3000/agente/agent-d/claim -H "X-Api-Key: $AGENT_API_KEY"
```

---

## Env

| Var | Default | Efeito |
|-----|---------|--------|
| `PORT` | `3000` | porta HTTP |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | localhost / 5432 / connectmax… | Postgres |
| `DB_SYNC` | `true` | TypeORM `synchronize` (desligar em prod) |
| `EXTRACT_CWD` | `../../../../screen-robot/src` | cwd do `npm run login-extract-profiles` |
| `PROFILES_API_URL` | `http://127.0.0.1:$PORT` | URL injetada no filho do `/extract/start` |
| `JWT_SECRET` | `dev-insecure-change-me` | assinatura do access token |
| `JWT_EXPIRES_IN` | `12h` | validade do JWT |
| `AUTH_ADMIN_EMAIL` / `AUTH_ADMIN_PASSWORD` | `admin@connectmax.local` / `ChangeMeAdmin!2026` | seed do 1º admin |
| `AGENT_API_KEY` | (vazio) | chave global `X-Api-Key` (admin); preferir `POST /agentes/:id/api-key` |
| `AGENT_HEARTBEAT_STALE_MS` | `120000` | sem heartbeat → `online: false` |

### Produção Contabo

Stack API + web + Postgres no mesmo host `144.126.154.90` (sem Tailscale entre VMs).

| Peça | Onde |
|------|------|
| Postgres | Docker Compose `/opt/postgres/` |
| API | systemd `connectmax-api` → `/opt/connectmax/vendas/api` (`DB_HOST=127.0.0.1`) |
| Web | nginx → `/opt/connectmax/vendas/web/dist` + proxy `/profiles` etc. → `:3000` |
| URL | `http://144.126.154.90/` |
| Worker | `/opt/connectmax/vendas/worker` · unit `connectmax-worker` (agent-d) |
| Host AVD | **precisa nested KVM** (`/dev/kvm`). VPS `144` (`vmi3645318`) **não tem** — `kvm-ok` falha. VDS antigo `185.250.37.82` (`vmi3645369`) era o host AVD; offline. |
| nginx conf | canônico: [`../web/deploy/nginx-connectmax.conf`](../web/deploy/nginx-connectmax.conf) → `/etc/nginx/sites-available/connectmax` |

**Antes → depois (AVD):** agentes `agent-b/c/d/e` no VDS `185` → cadastro `agent-d` migrado para `144`; `agent-b/c/e/d-clone` removidos. Worker instalado em `144`, **desabilitado** até haver host com KVM + LinkedIn.  
**Rollback:** ligar VDS `185`, PATCH `agent-d` de volta (`ipPublico=185.250.37.82`, `ipPrivado` Tailscale, `nestedKvm=true`, SSH da VDS); `systemctl enable --now connectmax-worker` só com AVD no ar.

Rotas SPA+API (`/avds`, `/servidores`, `/empresas`, `/dashboard`, `/profiles/:uuid`): **fetch JSON → Nest**; só `Accept: text/html` (refresh do browser) serve `index.html`. **Não** use `location = /avds { try_files … }` — isso devolve HTML no `GET /avds` e o front quebra com `Unexpected token '<'`.  
**Antes → depois:** exact `try_files` nas rotas compartilhadas → proxy + `if ($http_accept ~* text/html)`. **Rollback:** restaurar o conf anterior na VPS ou o commit anterior do arquivo canônico; `nginx -t && systemctl reload nginx`.

```bash
# .env na VPS 144 (não versionado)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=connectmax
DB_PASSWORD=<ver /opt/postgres/.env>
DB_NAME=connectmax
DB_SYNC=true
```

**Antes → depois:** API em `185` + `DB_HOST=144` (dependia de Tailscale) → API+front em `144` com Postgres local.  
**Rollback:** subir de novo em `185` com Tailscale/`ipPrivado` ou VPN entre VMs; `DB_HOST=144.126.154.90`.  
**VPS DB:** `cd /opt/postgres && docker compose down` / `up -d`. Credenciais em `/opt/postgres/.env`.
