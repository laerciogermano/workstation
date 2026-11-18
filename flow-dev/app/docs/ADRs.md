# ADRs — Flow.dev (app real)

Formato Nygard. Base: `core/definir-projeto-moderno`.

## ADR-001 · Monólito modular Node/TS + React (aceito)
**Contexto:** o pacote core manda *modular monolith first*, TypeScript `strict`, Express, Zod na borda, Pino, Postgres como fonte de verdade.
**Decisão:** npm workspaces — `@flow/shared` (tipos + contratos Zod + modelo de domínio puro: layout, FOP, exportação), `@flow/api` (Express 5, módulos `auth/projects/elements/data/catalog/runs`), `@flow/web` (Vite + React 19 + TanStack Query).
**Consequência:** o mesmo código de domínio roda no servidor (exportação) e no cliente (layout do Flow). Sem microserviços.

## ADR-002 · IDR = uuidv7 público + bigint interno (aceito)
PK interna `bigint identity`; ID público `uuid` v7 (`uuidv7()` do PG 18). A API só expõe o UUID (o IDR do PRD). Nome é rótulo e pode repetir (teste automatizado cobre).

## ADR-003 · Sessão por cookie httpOnly, não JWT (aceito)
Token opaco de 32 bytes; no banco só o SHA-256. Cookie `httpOnly; SameSite=Lax; Secure` em produção. Senha com Argon2id. CSRF: SameSite + checagem de `Origin` + só JSON. Rate limit em `/auth` e geral. Autorização **por recurso** (todo acesso resolve `projeto.owner_id = usuário`; fora do dono = 404, anti-IDOR).
**Pendente:** RLS no Postgres (hoje a barreira é a camada de aplicação, testada).

## ADR-004 · Execução de IA em processo, sem fila (aceito, revisitar)
O gap apontado pelo core ("worker + fila + outbox") foi **adiado de propósito**: com 1 instância, os estados (`pendente/exec/ok/fail/cancel`) vivem no Postgres e o runner (`runs/runner.ts`) apenas os transita; no boot, `exec` volta a `pendente`. A chamada real aos modelos ainda é simulada. Ao ir para múltiplas instâncias ou chamar APIs reais: BullMQ + Redis (AOF, `noeviction`) + outbox transacional, handlers idempotentes.

## ADR-005 · Etapas "biblioteca Node" rodam num sandbox simulado (aceito)
`node:vm` sem `process`/`require`, `codeGeneration` desligado, timeout de 1 s (síncrono) e 3 s (assíncrono); `node:http/fs/path/crypto` são stubs — **sem rede e sem disco real**. Execução de código arbitrário de verdade exigiria container/worker isolado (novo ADR).

## ADR-006 · Migrations imutáveis + rollback (aceito)
`db/migrations/NNN_*.sql` com checksum em `public.flow_migrations`; alterar uma já aplicada falha o boot. Rollback total: `npm run db:migrate -w @flow/api -- down` (`*.down.sql`).

## ADR-007 · Visitante por UUID, conta depois (aceito)
Sem tela de login. `users.person_key` (uuid v4, segredo da pessoa) identifica o visitante; sessão em cookie httpOnly e o código fica no navegador para retomar. `/auth/register` **vincula** e-mail+senha ao mesmo usuário (mesmo UUID e projetos); `/auth/login` leva os projetos do visitante para a conta existente. Contas com senha **não** retomam por código. Pendente: limpeza de visitantes abandonados.
