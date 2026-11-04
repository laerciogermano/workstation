# RoleGo Beta 1.0 — monorepo

Implementação do Beta descrito em [`docs/`](docs/README.md): **E01** conta, onboarding e perfil · **E02** publicação e descoberta · **E03** ciclo de vida do evento · backoffice mínimo. Contexto para agentes de IA em [`CLAUDE.md`](CLAUDE.md).

## Rodar localmente

Pré-requisitos: Node 22, pnpm 9 (`corepack enable`), Docker.

```bash
pnpm i
pnpm infra:up          # Postgres/PostGIS (5432) + Mailpit (SMTP 1025, UI http://localhost:8025)
cp apps/api/.env.example apps/api/.env
pnpm db:seed           # migrations + Curitiba: ~60 eventos, 10 privados, 8 encerrados com avaliações
pnpm dev               # API http://localhost:3000/api/v1 · PWA http://localhost:5173
```

Contas do seed (senha `rolego2026`): `ana@rolego.dev` (usuária com avaliação pendente), `club@rolego.dev` (casa de eventos), `laercio@rolego.dev` (anfitrião de eventos privados, códigos `PRVA2K`, `PRVB3K`, `PRVC4K`), `admin@rolego.dev` (admin → `/admin`). `pnpm db:seed --big` acrescenta 10 mil eventos para `EXPLAIN`/carga.

## Qualidade

| Comando | O que roda |
|---|---|
| `pnpm verify` | lint + typecheck + unit (API e web) + integração no Postgres real |
| `pnpm test:e2e` | Playwright: cadastro → onboarding → feed → confirmar presença; reset de senha lendo o e-mail no Mailpit |
| `node scripts/bundle-budget.mjs` | orçamento do JS inicial (≤ 250 KB gzip) |

Testes que cobrem os riscos do PRD (docs/09 §4): corrida na capacidade (20 RSVPs, 5 vagas), contrato de privacidade do evento privado em todas as rotas × perfis, borda do raio, refresh com reuso, JWT adulterado, revogação imediata ao bloquear, força bruta no código, magic bytes, fuso/madrugada, janela de avaliação.

## Estrutura

```
apps/api     NestJS 11 + Drizzle + PostGIS + pg-boss (HTTP: main.ts · worker: worker.ts)
apps/web     React 19 + Vite PWA + React Router 7 + TanStack Query + CSS Modules
packages/contracts  schemas Zod (fonte única de request/response/erros)
packages/tokens     design tokens --rg-* (único lugar com hex)
infra/       compose dev/staging/prod, Dockerfiles, nginx
e2e/         Playwright
docs/        cópia viva da documentação do Beta
```

## Estado da implementação

Feito: todos os requisitos **M** do PRD (E01, E02, E03 e ADM), mais os **S** de verificação de e-mail, "Rolês que fui", galeria/edições anteriores, página do organizador, busca e "Ao vivo / Estou aqui". Telas T-01 a T-49 e T-61 do protótipo.

Pendente (ver [ADR-016](docs/04-adrs.md#adr-016) e o [plano](docs/11-plano-de-implementacao.md)): passkeys, login com Apple, OpenTelemetry/Grafana/Faro, PostHog, bounces por IMAP, Mailcow/DNS (BETA-011), deploy em staging (BETA-010), backups (BETA-605), carga k6, ZAP e auditoria de a11y (M6). O Google OAuth está implementado, mas só aparece com `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (e `VITE_GOOGLE_CLIENT_ID` no web) configurados.
