# RoleGo — contexto para agentes de IA

> Modelo para copiar na raiz do monorepo do Beta. Mantenha com no máximo cerca de 150 linhas.

## O que é
RoleGo ("Viva o Rolê"): PWA para descobrir eventos perto (feed/swipe/lista por raio), ver quem vai, confirmar presença e avaliar. **Escopo do Beta: E01 Conta/onboarding, E02 Publicação/descoberta, E03 Ciclo de vida do evento.** Sem venda de ingresso, sem social (amigos/chat), sem mapa, sem push.

## Docs (leia o que a task pedir)
- PRD: `docs/01-prd.md` · Histórias + Gherkin: `docs/02-historias/`
- Arquitetura: `docs/03-arquitetura.md` · ADRs: `docs/04-adrs.md`
- Dados: `docs/05-modelo-de-dados.md` · API: `docs/06-contratos-api.md`
- Diagramas: `docs/07-diagramas.md` · Regras de código: `docs/08-boas-praticas-codigo.md`
- Testes: `docs/09-estrategia-de-testes.md` · Segurança/LGPD: `docs/10-seguranca-privacidade-lgpd.md`
- Plano/tasks: `docs/11-plano-de-implementacao.md` · Protótipo: `docs/prototipos/index.html` (telas T-xx)

## Stack
pnpm + Turborepo · TypeScript strict · `apps/api` NestJS 11 + Drizzle + PostgreSQL 16/PostGIS + pg-boss · `apps/web` React 19 + Vite PWA + React Router 7 + TanStack Query + CSS Modules · `packages/contracts` (Zod, fonte única) · `packages/tokens` (cores `--rg-*`).
Auth: JWT EdDSA de 10 min (`rg_at`) + refresh rotativo (`rg_rt`) + passkeys. E-mail: SMTP Mailcow (Mailpit em dev/staging). Observabilidade: OpenTelemetry → Grafana (Loki/Prometheus/Tempo) + Faro no front.

## Comandos
```bash
pnpm i
pnpm dev               # db + mailpit (docker) + api + web
pnpm db:migrate        # aplica migrations
pnpm db:seed           # seed determinístico (Curitiba)
pnpm test              # unit
pnpm test:int          # integração (Testcontainers, precisa de Docker)
pnpm test:e2e          # Playwright
pnpm verify            # lint + typecheck + test + test:int (rode antes de concluir)
```

## Regras inegociáveis
1. **Contrato primeiro**: toda mudança de API começa em `packages/contracts`.
2. **Evento só sai pelo `EventPresenter`**. Endereço/coordenadas de evento privado só para organizador, admin ou RSVP aprovado. Nunca em OG, log ou feed.
3. **Domínio puro** (`modules/*/domain`): sem Nest, Drizzle, I/O ou `new Date()` (use `ClockPort`).
4. Erros de negócio = `Result<T, DomainError>` → Problem Details com `code` de `contracts/errors.ts`.
5. Imports entre módulos só via `modules/<m>/index.ts`; `application` nunca importa `infra`.
6. Proibido: `any`, `enum` TS, `!` fora de teste, hex solto no CSS, `SELECT *`, `dangerouslySetInnerHTML`, logar PII/tokens.
7. Capacidade de RSVP: UPDATE condicional atômico (`docs/05 §4.3`); nada de "ler e depois escrever".
8. Datas em UTC; exibição em `America/Sao_Paulo`; dinheiro em centavos.
9. Textos de UI em pt-BR em `apps/web/src/lib/i18n/pt-BR.ts`; código em inglês.
10. Não mexer em migration já aplicada; não desligar lint/teste para passar.

## Como trabalhar uma task
1. Leia a task `BETA-nnn` em `docs/11`, a(s) US e os cenários Gherkin, o contrato e o diagrama citados, e o código vizinho.
2. Se a task é 🟡/🔴 ou falta alguma decisão: proponha um plano curto e **pare para aprovação**.
3. Implemente em camadas: contracts → testes (a partir do Gherkin) → domain → application → infra → http → web.
4. Rode `pnpm verify`. Termine com um resumo: arquivos alterados, cenários cobertos, suposições, o que ficou de fora.
5. Mudou uma regra? Atualize os docs no mesmo PR.

## Commits
Conventional Commits em pt-BR com o ID: `feat(discovery): swipe com desfazer (US-02.12, BETA-306)`.
