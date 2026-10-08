# Plano de implementação — prospecção LinkedIn por scripts

**Por quê:** rodar prospecção em escala com custo previsível, sem motor de IA no caminho crítico.  
**Antes:** jornadas via `runAgent` / `decide` (EP-07) + roteiros em linguagem natural ([`screen-robot/roteiros/`](../../screen-robot/roteiros/jornada-comprador.md)).  
**Depois:** scripts determinísticos (OCR + regras) no linkedin-agent; fila/board/pool em vendas; screen-robot só como lib de device.  
**Rollback:** voltar a `npm run agent -- --prompt …` nos roteiros; não usar pool/jobs deste plano.

**Umbrella:** [`../README.md`](../README.md) · **Ops LinkedIn:** [`../linkedin-agent/README.md`](../linkedin-agent/README.md) · **Negócio:** [`../vendas/README.md`](../vendas/README.md) · **Lib:** [`../../screen-robot/README.md`](../../screen-robot/README.md)

---

## 1. Arquitetura (3 camadas)

```text
vendas          → board, fila, limites, agenda, UI de ops, device pool
linkedin-agent  → 1 script por operação LinkedIn (sem IA)
screen-robot    → provision / extract / operate / session
devices         → 1 serial = 1 conta ativa; até 4 por máquina
```

| Camada | Responsabilidade | Não faz |
|--------|------------------|---------|
| **screen-robot** | Device genérico: `provisionEmulator`, `launch`, `extract`, `findByText`, `tap`/`tapElement`, `type`, `scroll`, `key`, `saveSession`/`restoreSession` | LinkedIn, fila, faturamento |
| **linkedin-agent** | Traduz intenção → sequência OCR + gestos; contrato tipado por op | Cadência comercial, board, alocação de device |
| **vendas** | Funil, jobs, horários, capacidade, pool de seriais | Gestos ADB / OCR |

Dependências: `vendas` → `linkedin-agent` → `screen-robot`. O robô não conhece LinkedIn; o agente não conhece fila/faturamento.

---

## 2. Script, não IA

Maior parte do volume (todo) **não precisa de token**:

| Op | IA? | Papel |
|----|-----|--------|
| Extrair lista (searchs) | não | script 24/7 |
| Conectar | não | script 24/7 |
| Enviar mensagem | não | script (janela seg 8h–12h) |
| Pegar URL | opcional | heurística OCR; IA só se falhar |
| Ler msg / captar contato | opcional | OCR; IA plugável depois |

Padrão de script (máquina de estados curta):

```text
loop:
  ocr = extract({ serial, engine: "rapidocr" })
  se loading → sleep + retry
  se alvo (findByText / regex) → tap / type / scroll
  se terminal (fim lista / weekly limit) → return resultado tipado
```

Proibido no caminho de produção: `runAgent`, `decide`, `npm run agent`.  
Referência de UI: roteiros e fixtures do screen-robot — não são o runtime.

Contrato estável (exemplos):

```js
extractSearch({ serial, query, location }) → { profiles[] }
connect({ serial, profileUrl }) → { status, buyerFields, reason? }
sendMessage({ serial, profileUrl, text }) → { status, reason? }
```

---

## 3. Funil = board de jobs

Colunas → estados persistidos:

```text
searchs → profiles → Lead → Conectado → Mensagem Enviada → Mensagem Recebida
```

| Job | Entrada | Saída | Script |
|-----|---------|-------|--------|
| `extract_search` | keyword | cards (nome, cargo, cidade…) | lista People + scroll |
| `extract_urls` | card/perfil | URL/id | abrir perfil / deep link |
| `connect` | URL/perfil | `conectado` \| `pending` \| `limite` | Connect → Skip |
| `send_message` | lead + template | `enviada` | Message + type |
| `capture_contact` | thread | wpp/email | OCR (+ IA opcional) |

**1 job = 1 device por vez.** Não misturar Connect e Message no mesmo loop.

---

## 4. Device pool

### 4.1 Modelo (modo A — MVP)

**1 slot = 1 conta fixa.** Até 4 slots por máquina. Conta sem slot idle espera na fila.

```text
Máquina
  ├── slot 0  → serial A  → conta A  → busy|idle|booting|…
  ├── slot 1  → serial B  → conta B
  ├── slot 2  → serial C  → conta C
  └── slot 3  → serial D  → conta D

Fila de jobs ──► scheduler ──► claim(slot) ──► script(linkedin-agent) ──► release
```

| Conceito | Significado |
|----------|-------------|
| **Slot** | 1 device no ar (capacidade da máquina) |
| **Account** | Identidade LinkedIn; afinidade fixa com um slot |
| **Job** | 1 operação atômica para 1 conta |

Regra dura: **1 serial = no máximo 1 job por vez.**

Modo B (N contas compartilhando 4 slots com restore de sessão a cada job) fica **fora do MVP** — só se a troca de sessão for barata.

### 4.2 Estados do slot

```text
offline → booting (~3 min) → idle → claimed → busy → idle
                              ↑                │
                              └──── release ───┘
         erro/limite → cooldown (na conta) / quarantine (no slot)
```

| Estado | Significado |
|--------|-------------|
| `offline` | Sem AVD/container |
| `booting` | `provisionEmulator` / restore |
| `idle` | Serial online, livre |
| `busy` | Job rodando (`jobId` + lease) |
| `cooldown` | Conta em rate-limit / weekly limit (slot pode voltar idle sem job dessa conta) |
| `quarantine` | Device quebrado — fora do pool |

### 4.3 Dados

```text
Slot { id, name, kind, serial?, state, accountId, jobId?, leaseUntil?, updatedAt }
Account { id, sessionPath, weeklyConnects, windows }
Job { id, type, accountId, payload, status, slotId?, attempts, createdAt }
```

Persistência MVP: SQLite. Multi-máquina depois: Postgres + `machine_id`.

### 4.4 API do pool

```js
ensureSlots(slots)           // provision + restoreSession por slot
claim(accountId, jobId)      // → { slotId, serial } | null
heartbeat(slotId, jobId)     // renova lease
release(slotId, result)      // busy → idle
markCooldown(accountId, reason)
```

Claim atômico (ex. SQLite):

```sql
UPDATE slots
SET state = 'busy', job_id = ?, lease_until = ?, updated_at = ?
WHERE id = ? AND account_id = ? AND state = 'idle'
  AND (lease_until IS NULL OR lease_until < ?)
```

`changes === 0` → outro worker pegou; retorna `null`.

### 4.5 Boot (screen-robot)

```js
const { serial } = await provisionEmulator({
  provision: { name: slot.name, kind: slot.kind, connectTimeoutMs: 180_000 },
});
// mesmo name → create-or-attach (start-runtime)
await restoreSession({ path: account.sessionPath }).catch(() => null);
```

`provision.name` estável: `ConnectMax_0` … `ConnectMax_3`.

### 4.6 Scheduler

```text
tick (~2s):
  1. reclaim leases expirados → idle + job failed/retry
  2. nextJob (window ok, sem cooldown, attempts < max)
  3. claim(accountId, jobId) — se null, wait
  4. runJob → linkedin-agent({ serial }) → release
```

Prioridade sugerida: `send_message` na janela → `connect` / `extract_*` 24/7.  
Fairness: teto de jobs consecutivos por conta.  
Heartbeat do worker ~30s; sem ping → lease expira.

### 4.7 Capacidade (todo)

| Recurso | Valor |
|---------|--------|
| Máquina | até 4 devices |
| Boot | ~3 min |
| Op típica | ~4–5 min |
| Connect / semana | ~100 / conta (limite LinkedIn) |
| Mensagem | seg 8h–12h |

OCR de weekly limit → `markCooldown(account)`, não quarantine do slot.

---

## 5. Onde implementar

```text
connectmax/vendas/src/
  db.js              # schema slots / accounts / jobs
  pool.js            # ensureSlots, claim, release, heartbeat
  scheduler.js       # tick, nextJob, windows
  worker.js          # runJob
  ops/               # wrappers → linkedin-agent
  supervisor.js      # entry

connectmax/linkedin-agent/src/
  extract-search.js
  connect.js
  send-message.js
  …                  # só recebe { serial, … }; importa screen-robot

screen-robot/        # sem mudanças de domínio LinkedIn / pool
```

---

## 6. Ordem de construção

Regra: **primeiro caso → validar → escalar.**

| # | Entrega | Aceite |
|---|---------|--------|
| 1 | Schema + seed 1 slot / 1 account | migrate ok |
| 2 | `ensureSlots` + `provisionEmulator` (1 slot) | serial idle |
| 3 | `claim` / `release` / lease | 2 claims concorrentes → 1 ganha |
| 4 | Job `connect` end-to-end (1 device) | status no board |
| 5 | `tick` + janelas + cooldown | msg só na janela; limit → cooldown |
| 6 | Escalar para 4 slots | 4 busy em paralelo |
| 7 | `extract_search` | cards no board `profiles` |
| 8 | `send_message` | coluna Mensagem Enviada |
| 9 | `extract_urls` / `capture_contact` | heurística; IA opcional |
| 10 | UI de operações | dispara jobs (comando = script) |

Prioridade de ops: `extract_search` + `connect` (maior ROI, zero token) antes de mensagem e captura.

---

## 7. O que não fazer

- Pool ou regras LinkedIn dentro de [`screen-robot/`](../../screen-robot/README.md)
- Compartilhar 1 `serial` entre 2 jobs
- Modo B (troca de conta no slot) no MVP
- `runAgent` / `decide` no worker de produção
- Script monolítico com funil inteiro embutido — 1 arquivo por op

---

## 8. Caminho inverso

| Mudança | Como reverter |
|---------|----------------|
| Scripts no linkedin-agent | Parar workers; voltar a `npm run agent` + roteiro |
| Pool/fila em vendas | Desligar supervisor; operar 1 serial manual via lib |
| Modo A (slot=conta) | Só se migrar para B: documentar restore por job |
| Engine `rapidocr` | `extract({ engine: "tesseract" })` / env legado |

---

## Próximos passos

1. Validar este plano (1 slot + `connect` como piloto).  
2. Implementar §6 itens 1–4 em [`../vendas/`](../vendas/README.md) + [`../linkedin-agent/`](../linkedin-agent/README.md).  
3. Só então escalar pool para 4 e demais jobs.
