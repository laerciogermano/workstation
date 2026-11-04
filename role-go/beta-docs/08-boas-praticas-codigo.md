# RoleGo Beta — Boas práticas de código

Regras obrigatórias para humanos **e agentes de IA**. Sempre que possível, cada regra é verificada por ferramenta (lint, typecheck, teste ou CI). O que a ferramenta não pega vira item do checklist de PR (§12).

## 1. Princípios

1. **Simples antes de esperto.** Resolver o caso do Beta, não o de 2028. Sem abstração com um único uso (exceção: os ports listados na arquitetura).
2. **Contrato primeiro.** Mudança de API começa em `packages/contracts`.
3. **Domínio puro.** Regra de negócio em `domain/`, sem Nest, Drizzle, `Date.now()` ou I/O.
4. **Explícito > implícito.** Sem mágica de decorators para regra de negócio; policies são funções.
5. **Pequeno e reversível.** PR com ≤ 400 linhas alteradas (fora gerados/migrations), uma história ou uma task por PR.
6. **Teste é especificação.** Cenários Gherkin → testes com o mesmo nome.

## 2. TypeScript

- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`.
- Proibido: `any` (use `unknown` + narrowing), `as` para silenciar erro (permitido só em teste ou com comentário `// why:`), `!` non-null fora de teste, `enum` do TS (use union literal + `as const`).
- IDs com **branded types**: `type EventId = string & { __brand: 'EventId' }`.
- Erros de negócio **não** são exceções: o domínio retorna `Result<T, DomainError>` (`neverthrow` ou implementação própria de cerca de 30 linhas). Exceção só para falha inesperada (bug ou infra).
- Datas: `Date` em UTC no domínio; formatação só na borda (`date-fns-tz`). Nunca `new Date()` direto: use `clock.now()`.
- Dinheiro em centavos (`number` inteiro) com o tipo `Cents`.
- Imports absolutos por alias (`@api/…`, `@web/…`, `@rolego/contracts`).

## 3. Arquitetura de pastas

### API — por módulo
```
modules/events/
├── domain/
│   ├── event.ts                 # entidade + regras (publish, cancel, phase)
│   ├── event.errors.ts          # union de DomainError do módulo
│   ├── value-objects/           # time-range.ts, venue.ts, access.ts
│   └── events.ts                # eventos de domínio (EventPublished, EventCancelled…)
├── application/
│   ├── ports/                   # event.repository.ts (interface)
│   ├── policies/                # access.policy.ts (funções puras)
│   ├── use-cases/               # publish-event.use-case.ts (1 caso de uso = 1 arquivo)
│   └── presenters/              # event.presenter.ts
├── infra/
│   ├── drizzle-event.repository.ts
│   └── schema.ts                # tabelas Drizzle do módulo
├── http/
│   ├── events.controller.ts     # fino: valida → chama use case → presenter
│   └── organizer-events.controller.ts
├── events.module.ts
└── index.ts                     # exporta só o que outros módulos podem usar
```
**Regras de import (eslint `boundaries` / `import/no-restricted-paths`):**
- `domain` não importa nada fora de `domain` e `shared/kernel`.
- `application` importa `domain` e `ports`, nunca `infra`.
- `http` importa `application`; nunca chama o repositório direto.
- Um módulo importa outro **só** via `modules/<outro>/index.ts`.

### Web — por feature
```
features/discovery/
├── pages/FeedPage.tsx
├── components/EventCard.tsx, SwipeDeck.tsx
├── hooks/useFeed.ts, useSwipeDeck.ts
├── api.ts                       # funções fetch tipadas pelos contracts
└── discovery.test.tsx
```
- `ui/` (design system) não importa `features/`.
- Uma feature não importa outra feature; o compartilhado sobe para `ui/` ou `lib/`.
- Estado do servidor **só** no TanStack Query. Estado global de UI mínimo (React context para usuário autenticado/tema; tokens **nunca** ficam acessíveis ao JS: só em cookies httpOnly). Sem Redux.

## 4. Nomenclatura

| Item | Padrão | Exemplo |
|---|---|---|
| Arquivos | `kebab-case` + sufixo do papel | `publish-event.use-case.ts`, `event.presenter.ts` |
| Componentes React | `PascalCase.tsx` | `EventCard.tsx` |
| Hooks | `useX` | `useRsvp` |
| Classes/tipos | `PascalCase` | `PublishEventUseCase` |
| Funções/variáveis | `camelCase`, verbo para ação | `canSeeExactAddress` |
| Constantes | `SCREAMING_SNAKE` | `RADIUS_MAX_KM` |
| Tabelas/colunas | `snake_case` | `going_count` |
| Rotas | plural, kebab | `/events/:id/guests` |
| Códigos de erro | `SCREAMING_SNAKE` | `EVENT_FULL` |
| Domínio em código | **inglês**; textos de UI em **pt-BR** em `lib/i18n/pt-BR.ts` | `Rsvp`, "Confirmar presença" |

Glossário de termos de domínio (Rolê = Event, Presença = RSVP etc.) em [15-glossario](15-glossario.md).

## 5. Backend (NestJS)

- Controller fino (≤ 15 linhas por handler): `@ZodBody(schema)` → `useCase.execute()` → `presenter` → mapeia `Result` para HTTP com `toHttp(result)`.
- Um caso de uso = uma classe com `execute(cmd)`; recebe `viewer` explícito; abre transação com `db.transaction(tx => …)` e passa o `tx` para os repositórios.
- Eventos de domínio são publicados **depois** do commit (`afterCommit`) ou como jobs na mesma transação (pg-boss `send` com o `tx`).
- Queries de leitura complexas (feed) ficam em `*QueryService` com SQL explícito via `sql` do Drizzle, **sempre parametrizado**.
- Configuração: `@nestjs/config` + schema Zod de env; a app não sobe com env inválida.
- Logs: `logger.info({ eventId, userIdHash }, 'event.published')` com `traceId` do OpenTelemetry. Nunca logar e-mail, senha, JWT, refresh token, endereço ou coordenadas.
- Métricas de negócio e técnicas via OpenTelemetry Metrics (`rolego_rsvp_total{result}`, `auth_refresh_reuse_total`, `email_sent_total{template,status}`), visualizadas no Grafana.
- Auth: só o `TokenService` assina ou verifica JWT; algoritmo fixo `EdDSA` na verificação (rejeitar `none`/HS*); claims tipados por schema Zod.
- Toda rota nova tem: schema de entrada, schema de saída, guard/policy, teste de integração, entrada no OpenAPI.

## 6. Banco e migrations

- Migrations geradas pelo drizzle-kit, **revisadas à mão**, commitadas; nunca editar uma migration já aplicada.
- Mudanças **expand → migrate → contract** (adicionar coluna nullable → backfill → constraint) em PRs separados quando houver dado em produção.
- Toda FK tem índice; toda consulta nova da descoberta passa por `EXPLAIN ANALYZE` com o seed grande (10 mil eventos), e o resultado vai no PR.
- Sem `SELECT *` em código de produção.
- Transação curta; nada de I/O externo (HTTP, e-mail) dentro dela.

## 7. Frontend (React)

- Componentes funcionais; props tipadas; sem `default export` (exceto páginas lazy).
- Formulário = react-hook-form + `zodResolver(schemaDoContracts)`; mensagens vêm do schema/i18n.
- Mutations com UI otimista **somente** para interesse/passe; RSVP espera o servidor (por causa da capacidade).
- Acessibilidade: elementos nativos (`button`, `a`, `label`); foco visível; `aria-live` para toasts; swipe sempre com botões equivalentes; alvos ≥ 44 px; `prefers-reduced-motion` desliga animações.
- Imagens: `srcset` com as variantes, `loading="lazy"` fora da dobra, `width/height` explícitos (CLS).
- Estilo: CSS Modules + tokens `var(--rg-*)`. **Proibido hex solto** em componente (stylelint `color-no-hex` fora de `packages/tokens`).
- Rotas lazy por feature; orçamento de bundle verificado no CI (`size-limit`).
- Erros: um `ErrorBoundary` por rota + toasts mapeados por `code`.

## 8. Segurança no código (resumo, detalhes em [10](10-seguranca-privacidade-lgpd.md))

- Toda entrada validada por Zod (body, query, params, headers relevantes).
- Autorização no **caso de uso** (policy), não só no guard.
- Saída de evento **só** pelo `EventPresenter`.
- Upload: magic bytes, tamanho máximo, reencode via sharp (remove EXIF/GPS), nome aleatório.
- Sem `dangerouslySetInnerHTML`; descrição do evento renderizada como texto com quebra de linha e links autolinkados e sanitizados.
- Segredos só em env; `.env` fora do git; `gitleaks` no CI.

## 9. Testes (resumo, detalhes em [09](09-estrategia-de-testes.md))

- Domínio/policies: unit 100% dos ramos.
- Casos de uso: integração com Postgres real (Testcontainers) + fakes de ports externos.
- Endpoints: testes de contrato (schema de saída + regras de privacidade).
- Fluxos críticos: Playwright com os cenários Gherkin.
- Nome do teste = nome do cenário: `it('Concorrência na última vaga: exatamente um confirma')`.

## 10. Git e fluxo

- Trunk-based: `main` protegida; branches curtas `feat/US-02.12-swipe`, `fix/…`, `chore/…`.
- **Conventional Commits** em português: `feat(discovery): swipe com desfazer (US-02.12)`.
- Squash merge; o PR referencia a US/task e o cenário Gherkin.
- CI obrigatório: `lint`, `typecheck`, `test:unit`, `test:int`, `test:e2e (smoke)`, `build`, `size-limit`, `gitleaks`.
- Feature flags simples (env/`flags.ts`) para coisas incompletas no `main`.

## 11. Ferramentas

| Ferramenta | Uso |
|---|---|
| ESLint (flat config) + `typescript-eslint` strict + `eslint-plugin-boundaries` + `jsx-a11y` | qualidade, fronteiras, a11y |
| Prettier | formatação (sem discussão de estilo no PR) |
| Stylelint | tokens obrigatórios |
| Vitest | unit/integração |
| Testcontainers | Postgres/PostGIS real nos testes |
| Playwright | e2e + screenshots |
| size-limit | orçamento de bundle |
| Husky + lint-staged | pre-commit rápido (lint + format dos arquivos tocados) |
| Renovate | atualizações semanais agrupadas |

## 12. Checklist de PR

- [ ] Referencia a US/task (`US-xx.yy` / `BETA-nnn`) e os cenários cobertos
- [ ] Contrato atualizado em `packages/contracts` (se houver API)
- [ ] Testes novos passando (unit/integração/e2e conforme o nível)
- [ ] Nenhum dado de evento privado sai fora do `EventPresenter`
- [ ] Sem hex solto, sem `any`, sem `new Date()` direto
- [ ] Migrations revisadas, com `EXPLAIN` quando mexe em consulta de descoberta
- [ ] Textos em pt-BR no arquivo de i18n; telas conferidas contra o [protótipo](12-prototipos.md)
- [ ] Docs atualizados (contratos, diagramas, ADR) quando a decisão mudou
- [ ] Screenshots/vídeo para mudança visual
