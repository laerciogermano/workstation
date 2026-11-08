# Node.js + TypeScript backend best practices (2024–2026)

Local mirrors of primary sources: [`referencias/nodejs-typescript/`](../../referencias/nodejs-typescript/).

## What are the current official/canonical docs for Node.js TypeScript, Express/Fastify patterns, NestJS architecture inspiration, Red Hat Node.js Reference Architecture?

### Takeaway
Canonical stack guidance for an Express modular monolith + TypeScript strict + PostgreSQL comes from **nodejs.org** (native TS / type stripping), **typescriptlang.org** (`strict`, dos/don’ts, `erasableSyntaxOnly`), **expressjs.com** production performance/security/shutdown, **fastify.dev** reverse-proxy and plugin principles (pattern inspiration), **docs.nestjs.com/modules** (feature-module encapsulation), and **nodeshift/nodejs-reference-architecture** (Red Hat/IBM production opinions).

### Cited Findings
- Node.js documents stable **type stripping** for running erasable TypeScript, with recommended `tsconfig` including `module: "nodenext"`, `erasableSyntaxOnly`, `verbatimModuleSyntax`; runtime does **not** type-check — [Node.js API: Modules TypeScript](https://nodejs.org/api/typescript.html); [Running TypeScript Natively](https://nodejs.org/learn/typescript/run-natively).
- Official Express production guides cover performance (`NODE_ENV=production`, async I/O, exception handling, reverse proxy, restarts), security (Helmet, TLS, input trust, cookies, audit), and SIGTERM graceful shutdown + k8s liveness/readiness — [Express performance](https://expressjs.com/en/advanced/best-practice-performance/); [Express security](https://expressjs.com/en/advanced/best-practice-security/); [Express health/shutdown](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown/).
- Fastify official Recommendations treat direct Internet exposure (TLS/static/multi-domain in-app) as an anti-pattern; prefer reverse proxy; validate/schemas on the edge — [Fastify Recommendations](https://fastify.dev/docs/latest/Guides/Recommendations/); [Fastify Principles](https://fastify.dev/docs/latest/Reference/Principles/).
- NestJS official Modules docs define feature modules, exports as public API, singleton shared providers, and warn against making everything `@Global()` — [NestJS Modules](https://docs.nestjs.com/modules).
- Red Hat/IBM **Node.js Reference Architecture** (nodeshift) is the market “opinionated production stack” from teams with large deployments: Express still primary web framework recommendation; Pino logging; Opossum circuit breakers; container/TS/ops guides — [nodeshift/nodejs-reference-architecture](https://github.com/nodeshift/nodejs-reference-architecture); [Web Framework](https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/functional-components/webframework.md); [TypeScript](https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/development/typescript.md).
- Docker Official Image / Docker Docs Node guide: multi-stage TS builds, `NODE_ENV=production`, non-root `node` user, `--init`/dumb-init, `CMD ["node",…]` — [Docker Node.js guide](https://docs.docker.com/guides/nodejs/); [nodejs/docker-node BestPractices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md).
- Red Hat 2024 framing maps nine Node pillars (event loop, LTS, deps, errors/logs, API specs, etc.) onto the Reference Architecture — [Nine Node.js pillars](https://developers.redhat.com/blog/2024/11/26/nine-nodejs-pillars-and-nodejs-reference-architecture).

### Inferences
- For Express modular monolith: treat Nest **feature modules + explicit exports** as the organizational pattern, Express/Fastify **production + reverse proxy** as runtime ops, Red Hat RA as dependency/ops checklist, Node/TS docs as toolchain contract.
- Prefer official docs over blogs for AI-readable references; architecture blogs can illustrate hexagonal/modular monolith but are secondary to Nest modules + RA for “market standard” claims.

### Gaps
- There is no single official “Express modular monolith” or “hexagonal Express” document from Express/Node foundations; hexagonal/ports-adapters guidance is pattern literature + Nest modularity, not a Node.js Foundation standard.
- PostgreSQL-specific official Node driver “architecture” guidance was not a primary target of this pass (use parameterized queries per Express security; DB choice covered partially in Red Hat Databases section — not fully mirrored here).

## What are non-negotiable TS compiler settings and error-handling patterns?

### Takeaway
Non-negotiable baseline: **`strict: true`**, Node-aligned module settings (`nodenext` / tsconfig bases), and for Node type-stripping ecosystems **`erasableSyntaxOnly` + `verbatimModuleSyntax`**; type-check with `tsc --noEmit` in CI. Error handling: catch at boundaries, structured logs (Pino), no sync I/O in request paths, propagate/circuit-break external failures, graceful SIGTERM.

### Cited Findings
- TypeScript `strict` enables the full strict family and may tighten further in future releases — [TSConfig `strict`](https://www.typescriptlang.org/tsconfig/strict.html).
- Red Hat RA recommends `strict: true`, `isolatedModules: true`, `esModuleInterop: true`, Node tsconfig bases; ship **compiled JS** to production (not raw TS); use **ajv** (or similar) for runtime validation because TS does not check at runtime — [RA TypeScript](https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/development/typescript.md).
- Node.js recommends TS ≥5.8 with `erasableSyntaxOnly` + `verbatimModuleSyntax` (+ `rewriteRelativeImportExtensions`, `module: nodenext`) when aligning with type stripping; enums/parameter properties/runtime namespaces unsupported without a transformer — [Node.js TypeScript API](https://nodejs.org/api/typescript.html); [`erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html).
- Official Do’s and Don’ts: avoid boxed types (`String`/`Number`/…), avoid `any` (prefer `unknown`), prefer `void` for ignored callback returns — [TS Do’s and Don’ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html).
- Express: never rely on uncaught exceptions (process crash); use try/catch and promises; set `NODE_ENV=production`; auto-restart via process manager + init system; custom error handlers — [Express performance](https://expressjs.com/en/advanced/best-practice-performance/); [Express security](https://expressjs.com/en/advanced/best-practice-security/).
- Express graceful shutdown on SIGTERM: stop accepting, drain, close DB — [Express health/shutdown](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown/).
- Red Hat logging: Pino to stdout, redact secrets, throw once / log at highest level with `error.stack` when unexpected — [RA Logging](https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/operations/logging.md).
- Red Hat fault tolerance: prefer mesh; else Opossum circuit breaker when retries/caching/latency bounds matter — [RA Failure handling](https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/operations/failurehandling.md).
- SQL injection defense via parameterized queries / prepared statements called out in Express security extras — [Express security](https://expressjs.com/en/advanced/best-practice-security/).

### Inferences
- For Express + TS strict + PostgreSQL: `strict` + noUnchecked side flags as needed + runtime schema validation at HTTP edge + parameterized SQL/ORM; never treat compile-time types as input validation.
- Production path should be `tsc` emit (or equivalent) in CI/CD, not relying solely on Node type stripping for deployable artifacts (aligns with Red Hat “ship JS”).

### Gaps
- Exact “must enable every strict subflag individually” checklist beyond `strict: true` varies by TS version; teams may add `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` as house rules — not mandated by a single official Node doc.
- Express’s older performance page still discusses domains/`uncaughtException` history; modern practice centers on promises/async + process restart — treat domains as historical, not current pattern.

## What modular monolith / hexagonal / ports-adapters practices are market standard?

### Takeaway
Market-standard *modular monolith* practice for Node/TS backends is **feature modules with an explicit public API** (Nest’s model is the clearest official articulation): encapsulate providers, export only the interface other modules may use, avoid global everything. Hexagonal/ports-adapters (domain inward, adapters at edges) is widely adopted as a complementary pattern inside modules, but is **not** standardized by Node/Express foundations.

### Cited Findings
- NestJS: feature modules group domain capabilities; providers private by default; `exports` = public API; shared modules keep singleton instances; `@Global()` discouraged as default design — [NestJS Modules](https://docs.nestjs.com/modules).
- Fastify principles: plugin-first composition, security/validation at the edge, easy migrate monolith ↔ microservices, no monkeypatching Node core — [Fastify Principles](https://fastify.dev/docs/latest/Reference/Principles/).
- Red Hat RA web framework: Express OK; separate business vs admin ports; middleware before routes; Helmet; health endpoints; testable small components — [RA Web Framework](https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/functional-components/webframework.md).
- Red Hat containers: non-root, multi-stage, no `npm start` in prod CMD, process manager for PID 1, scale outside container — [RA Building good containers](https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/development/building-good-containers.md); [docker-node BestPractices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md).
- Secondary (non-official) architecture writing describes modular monolith as bounded contexts with declared public APIs + optional ports/adapters inside modules — [example industry article](https://www.nazarboyko.com/articles/nodejs-architecture-patterns-that-age-well) (not primary; use only as illustration).

### Inferences
- Map Nest module rules onto Express folders: `modules/<feature>/{http,application,domain,infrastructure}` with a single `index`/facade export; enforce boundaries via lint/CI import rules.
- Ports/adapters: define repository/payment/etc. interfaces in domain/application; implement with `pg`/Prisma adapters; wire in composition root (`main`/DI) — fits Express modular monolith without adopting Nest runtime.
- Keep one deployable process initially; split only when module boundaries already proven (Fastify “route deployment should not matter” / Nest feature isolation).

### Gaps
- No RFC/official Node document defines “modular monolith” terminology or hexagonal folder layouts; teams must adopt Nest/RA + classic ports-adapters literature (Cockburn) as proxies.
- Official Nest docs describe modularity/DI well but do not prescribe hexagonal folder names; combining Nest inspiration with hexagonal is a synthesis, not a single official source.

---

## Local downloads (mirrors)

Directory: `/Users/laerciogermano/Documents/works/e-notas/beta-docs/referencias/nodejs-typescript/`

| File | Source |
| --- | --- |
| `nodejs-api-typescript.md` | https://nodejs.org/api/typescript.html |
| `nodejs-run-typescript-natively.md` | https://nodejs.org/learn/typescript/run-natively |
| `typescript-strict.md` | https://www.typescriptlang.org/tsconfig/strict.html |
| `typescript-erasable-syntax-only.md` | https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html |
| `typescript-dos-and-donts.md` | https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html |
| `express-production-performance.md` | https://expressjs.com/en/advanced/best-practice-performance/ |
| `express-production-security.md` | https://expressjs.com/en/advanced/best-practice-security/ |
| `express-healthcheck-graceful-shutdown.md` | https://expressjs.com/en/advanced/healthcheck-graceful-shutdown/ |
| `fastify-recommendations.md` | https://fastify.dev/docs/latest/Guides/Recommendations/ |
| `fastify-technical-principles.md` | https://fastify.dev/docs/latest/Reference/Principles/ |
| `nestjs-modules.md` | https://docs.nestjs.com/modules |
| `redhat-nodejs-reference-architecture-readme.md` | https://github.com/nodeshift/nodejs-reference-architecture |
| `redhat-nodejs-typescript.md` | https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/development/typescript.md |
| `redhat-building-good-containers.md` | https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/development/building-good-containers.md |
| `redhat-web-framework.md` | https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/functional-components/webframework.md |
| `redhat-failure-handling.md` | https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/operations/failurehandling.md |
| `redhat-logging.md` | https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/operations/logging.md |
| `docker-nodejs-language-guide.md` | https://docs.docker.com/guides/nodejs/ |
| `docker-nodejs-best-practices.md` | https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md |

## Top 10 practices (Express modular monolith + TS strict + PostgreSQL)

1. **`strict: true`** (+ Node-aligned `module`/`moduleResolution`; consider `erasableSyntaxOnly`/`verbatimModuleSyntax` if aligning with Node type stripping).
2. **`tsc --noEmit` in CI**; ship compiled JS (or proven emit pipeline) — don’t treat Node type stripping as production type safety.
3. **Runtime validate** untrusted input (JSON Schema/ajv or equivalent); TS types ≠ validation; parameterized SQL for PostgreSQL.
4. **Feature modules with explicit public API** (Nest-style exports); no cross-import of internals/repos.
5. **Ports/adapters inside modules with domain rules**; HTTP and `pg`/ORM stay at edges; wire in composition root.
6. **`NODE_ENV=production`**, Helmet, TLS at reverse proxy, no sync I/O on request path.
7. **Central error boundary**: throw once, structured Pino logs to stdout, redact secrets, don’t leak stacks to clients.
8. **Graceful SIGTERM** + readiness/liveness; close HTTP then DB pools.
9. **Circuit break / mesh** for flaky dependencies; propagate most async failures.
10. **Containers**: multi-stage, non-root, `CMD ["node",…]`, init for PID 1, memory limits aligned with V8 heap.
