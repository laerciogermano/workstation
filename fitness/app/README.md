# fitness · app

Implementação completa (front + back) do [PRD v1.1](../docs/prd.md), portando as 31 telas do [protótipo v1](../prototipos/v1/index.html) para um produto real. Segue o pacote [`core/definir-projeto-moderno`](../../core/definir-projeto-moderno/README.md): monólito modular, TypeScript strict, contratos Zod na borda, PostgreSQL como fonte de verdade, Twelve-Factor, ADRs e AGENTS.md.

## Stack

| Camada | Escolha |
|---|---|
| Monorepo | pnpm workspaces · Biome (lint + format) · TS 5 `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` |
| Domínio | `packages/domain` — funções puras compartilhadas por API e web (TMB, plano por estoque, kcal por MET, streak, insights) |
| Contratos | `packages/contracts` — schemas Zod = fonte de verdade da interface HTTP |
| API | `apps/api` — Fastify 5, `pg`, Pino, Helmet, rate limit, health/readiness, SIGTERM gracioso, migrations SQL imutáveis |
| Web | `apps/web` — React 19 + Vite 7 + React Router 7 + TanStack Query (cache persistido, offline-first), PWA mínima |
| Banco | PostgreSQL 16, schema `fitness` |

## Rodar

```bash
pnpm install
cp .env.example .env          # já vem pronto para o docker local
pnpm db:up                    # Postgres em localhost:5433 (container fitness-postgres)
pnpm db:migrate && pnpm db:seed
pnpm dev                      # API :3333 · web :5173 (proxy /v1 → API)
```

Abra <http://localhost:5173>. Na primeira abertura o aparelho recebe um token (sem conta) e cai no onboarding.

## Verificar

```bash
pnpm verify    # lint + typecheck + testes (domínio, API com Postgres real, componentes) + build
```

Os testes da API sobem a app com `inject`, usam o Postgres do docker e validam cada resposta contra o contrato Zod. Os nomes dos testes citam RF/RN do PRD.

## Estrutura

```text
packages/domain      regras puras (energy, diet, training, body, gamification, insights, social)
packages/contracts   Zod: entrada validada na API, tipos inferidos no cliente
apps/api/src
  app.ts             composição (plugins, erros, health, módulos)
  modules/<feature>/ *.repo.ts (SQL) · *.service.ts (caso de uso) · *.routes.ts (HTTP)
  shared/            env, db/tx, auth do aparelho, clock, erros
  db/                migrations/NNN_*.sql · migrate.ts · seed.ts
apps/web/src
  lib/               api, device, queries (TanStack), session, photos (IndexedDB), theme
  ui/                kit (componentes base), viz (anel, gráfico, figura, silhueta, mapa), icon
  screens/           uma pasta por fluxo E01–E08 do protótipo
docs/                architecture.md (C4 lean) · adr/ (MADR)
```

## Rastreio protótipo → app

| Fluxo | Telas | Rotas |
|---|---|---|
| E01 Primeiro uso | F-01…F-06 | `/bem-vindo`, `/comecar/{voce,rotina,objetivo,base,macros}` |
| E02 Hoje e progresso | F-10…F-12 | `/`, `/progresso`, `/insights` |
| E03 Dieta pelo estoque | F-20…F-24 | `/dieta/estoque`, `/dieta`, `/dieta/refeicao/:id`, `/dieta/fechar`, `/dieta/incompleto` |
| E04 Treino | F-30…F-32 | `/treino`, `/treino/exercicio/:id`, `/treino/concluido` |
| E05 Avaliação física | F-40…F-43 | `/corpo/medir`, `/corpo/foto`, `/corpo`, `/corpo/comparar` |
| E06 Vitrine | F-50…F-54 | `/vitrine/personagem`, `/vitrine`, `/vitrine/buscar`, `/p/:nick`, `/vitrine/privacidade` |
| E07 Academias | F-55, F-56 | `/academias`, `/academias/:id` |
| E08 Perfil e estados | F-60…F-62 | `/voce`, offline (inline), aparelho novo (boot) |

Diferenças deliberadas do protótipo: carga editável por exercício e PR real (melhor carga anterior); fotos reais pela câmera (getUserMedia ou galeria) guardadas só no aparelho; mapa posicionado por lat/lng reais; os quatro temas viram preferência em **Você**.
