# Arquitetura e filas (Node.js modular monolith + BullMQ)

Notas densas para Beta (Express modular monolith, Postgres, jobs: geocoding, scraping, email). Fontes baixadas em `e-notas/beta-docs/referencias/arquitetura/` e `.../filas/` com header `source_url`.

## Twelve-Factor App principles still relevant in 2026?

### Takeaway
Yes: core principles remain the default for portable SaaS/cloud apps in 2024–2026; Heroku/community open-sourced and is refreshing the manifesto because philosophy is timeless while 2011 examples aged.

### Cited Findings
- Twelve-Factor defines SaaS methodology: declarative setup, OS portability, cloud deployability, dev/prod parity, scale without rewriting architecture — language-agnostic, covers DB/queue/cache backing services. — [12factor.net](https://www.12factor.net/)
- Factors still published as: I Codebase, II Dependencies, III Config, IV Backing services, V Build/release/run, VI Processes, VII Port binding, VIII Concurrency, IX Disposability, X Dev/prod parity, XI Logs, XII Admin processes. — [12factor.net factors](https://www.12factor.net/codebase)
- Nov 2024: methodology open-sourced to modernize; Yehuda Katz: philosophy “surprisingly timeless” (>decade later still cited), but details/examples show age; refresh targets modern ecosystem. — [12factor open-source announcement](https://www.12factor.net/blog/open-source-announcement)
- Heroku (Sep 2024): cloud-native/K8s now default; core concepts “remarkably relevant,” outdated examples make concepts look obsolete; modernization planned with community. — [Heroku updating Twelve-Factor](https://www.heroku.com/blog/updating-twelve-factor-call-for-participation/)
- Feb 2025 commentary: principles remain foundations for resilient portable apps; landscape (containers/K8s) adds concerns original doc didn’t anticipate. — [Evolving Twelve-Factor](https://www.12factor.net/blog/evolving-twelve-factor)
- Apr 2025: Intuit reports long use of twelve-factor as shared platform philosophy (stateless workloads, config separation, decoupled deps); also notes gaps → internal “Intuit Factors” for security/observability. — [Intuit on Twelve-Factor evolution](https://www.12factor.net/blog/intuit-thrilled)
- III Config: store config in environment (not code). IV: treat DB/queue/cache as attached resources. VI: share-nothing processes. VIII: scale via process model. IX: fast startup + graceful shutdown. XI: treat logs as event streams. — [Config](https://www.12factor.net/config); [Backing services](https://www.12factor.net/backing-services); [Processes](https://www.12factor.net/processes); [Concurrency](https://www.12factor.net/concurrency); [Disposability](https://www.12factor.net/disposability); [Logs](https://www.12factor.net/logs)

### Inferences
- For Beta: map web + worker as separate process types (VIII/VI), Postgres/Redis/email SMTP as backing services (IV), env-based secrets (III), SIGTERM graceful worker close (IX) — all still first-class in 2026 ops.
- Treat official 12factor as still authoritative for defaults; expect refreshed examples/telemetry/security overlays rather than replacement of the 12 factors themselves.

### Gaps
- No single official “Twelve-Factor 2.0” final text as of this research date; modernization is in progress — cite 2017 site + 2024–2025 refresh posts, not a finished replacement spec.

## When modular monolith vs microservices?

### Takeaway
Default for a Beta product: modular monolith (clear module boundaries, single deploy); microservices only when complexity/team/scale/tech diversity justify the “microservice premium.”

### Cited Findings
- Fowler “Monolith First” (2015): almost all successful microservice stories started as monoliths; greenfield microservices often “serious trouble”; microservice premium slows early feedback; boundaries (Bounded Contexts) are hard to get right upfront; prefer monolith then split. — [Monolith First](https://www.martinfowler.com/bliki/MonolithFirst.html)
- Fowler: don’t consider microservices unless system too complex to manage as monolith; majority should be single monolith with good modularity. Premium driven by large teams, multi-tenancy, independent evolution, scaling, sheer size. — [Microservice Premium](https://www.martinfowler.com/bliki/MicroservicePremium.html)
- ThoughtWorks (2023): modular monolith = modules independently developed/tested, deployed as one unit; extractable when scale needs arise; vs conventional monolith: well-defined business-capability boundaries ready as future service candidates; start modular monolith while domain learning; move to microservices when independent scale, large team, diverse tech, or firm domain grasp. — [ThoughtWorks modular monolith](https://www.thoughtworks.com/en-us/insights/blog/microservices/modular-monolith-better-way-build-software)
- ThoughtWorks lists microservice costs: coordination, deploy/config, distributed logging/tracing, reliable communication, extra infra (gateways, discovery). — same source
- Cockburn hexagonal/ports-adapters: app inside communicates via ports; adapters for UI/DB/HTTP/tests; enables replaceable tech and automated tests without UI/DB. — [Cockburn hexagonal](https://alistair.cockburn.us/hexagonal-architecture); [AWS hexagonal](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html)

### Inferences
- Beta Express modular monolith fits Monolith-First + ThoughtWorks guidance: modules per domain (notas, geocoding, scraping, email) with ports (Postgres repo, BullMQ producer, SMTP adapter).
- Split to services later only if a module (e.g. scraping) needs independent scale/isolation; keep single Postgres until extract forces bounded data ownership.
- Hexagonal inside the monolith is orthogonal to microservices — use ports/adapters now without network boundaries.

### Gaps
- No quantitative “team size / RPS threshold” from Fowler/ThoughtWorks for the Beta stack specifically; decision remains qualitative.

## BullMQ production practices: idempotency, Redis noeviction, worker isolation, retries?

### Takeaway
Production BullMQ requires Redis AOF + `maxmemory-policy noeviction`, at-least-once semantics with idempotent/atomic handlers, sandboxed workers for CPU-heavy jobs, retries with backoff, graceful SIGINT/SIGTERM shutdown, and auto-removal of completed jobs.

### Cited Findings
- Persistence: enable AOF; ~1s fsync usually enough; many hosts lack persistence by default. — [Going to production](https://docs.bullmq.io/guide/going-to-production)
- Max memory: set `maxmemory-policy` to `noeviction` — “only setting that guarantees the correct behavior of the queues”; cache eviction breaks BullMQ. — same
- Reconnect: Queue should fail fast; Worker should wait indefinitely (`maxRetriesPerRequest: null` for ioredis workers); exponential retryStrategy default. — same
- Graceful shutdown: listen SIGINT/SIGTERM, `await worker.close()`; otherwise jobs stall (~30s default) then reprocess. — same
- Auto-job removal: default keeps completed/failed forever; configure keep few completed, many/all failed for debug/retry. — same
- Protect data: job payload stored cleartext; avoid secrets or encrypt sensitive fields. — same
- Idempotent jobs: retries require handlers where first success vs fail-then-retry leave same final state; keep jobs atomic/simple; split complex work via flows. — [Idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs)
- Architecture: job states wait / prioritized / delayed → active → completed|failed; Redis backend uses Lua atomic transitions; workers block on marker (no polling). — [Architecture](https://docs.bullmq.io/guide/architecture)
- Workers: throw → failed; lock + renew; CPU-bound work can miss renew → stalled → re-queued (at-least-once duplicate run). — [Workers](https://docs.bullmq.io/guide/workers)
- Sandboxed processors: run processor in separate process; less stall risk for CPU-heavy work. — same
- Retries: set `attempts` > 1; backoff `fixed` or `exponential` (+ optional jitter); without backoff, immediate retry; throw Error objects. Stalled past max stalled count also fails. — [Retrying failing jobs](https://docs.bullmq.io/guide/retrying-failing-jobs)
- Monitoring: attach `error` handlers on worker/queue; monitor failures, pile-ups, stopped workers (events/metrics/Prometheus/OTel). — [Going to production](https://docs.bullmq.io/guide/going-to-production)

### Inferences
- Beta: dedicated Redis for queues (never share eviction cache Redis); web process enqueues; separate worker process(es) for geocoding/scraping/email (12-factor concurrency + BullMQ isolation).
- Geocoding/email/scraping handlers: stable business keys + unique constraints / provider idempotency keys; scraping especially → sandboxed processor.
- Retries: exponential backoff for external APIs; after exhaustion keep failed jobs for manual replay; never put SMTP passwords in job data.

### Gaps
- Official idempotent-jobs page is short (principle + split flows); does not prescribe DB unique-constraint / outbox recipes — combine with outbox pattern sources below.
- Worker-vs-API process topology is operational convention, not a single BullMQ “must” page beyond process isolation for sandboxed processors.

## ADR practice, C4 model basics?

### Takeaway
Use short Nygard ADRs in-repo for significant decisions; use C4 Context + Container diagrams first (Components/Code only if valuable) for shared architecture maps.

### Cited Findings
- Nygard (2011): ADRs = short Markdown records for architecturally significant decisions (structure, NFRs, deps, interfaces, construction); sections Title, Context, Decision, Status, Consequences; store `doc/arch/adr-NNN.md`; number monotonically; superseded kept, not deleted; 1–2 pages; conversation with future developer. — [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- adr.github.io: Nygard template = title, status, context, decision, consequences; also MADR (options/tradeoffs + metadata) and Y-Statements. — [ADR Templates](https://adr.github.io/adr-templates/)
- C4 official: hierarchical abstractions — software systems, containers, components, code; diagrams Context, Containers, Components, Code; plus landscape/dynamic/deployment; notation- and tooling-independent; site by Simon Brown. — [c4model.com](https://c4model.com/)
- Abstractions: system = containers (apps/data stores) → components → code; people use systems. — [C4 abstractions](https://c4model.com/abstractions)
- Diagrams: most teams only need System Context + Container; don’t force all 4 levels. — [C4 diagrams](https://c4model.com/diagrams)

### Inferences
- Beta ADRs to capture early: modular monolith vs services; BullMQ+Redis vs in-process jobs; outbox for domain events; worker process split.
- C4 Container for Beta: Express API, Worker(s), Postgres, Redis, external geocode/scrape/email providers — enough for onboarding.

### Gaps
- No mandatory tooling from C4 official site; Structurizr etc. are optional (not required for Beta).

## Domain events / outbox patterns for reliability?

### Takeaway
Never dual-write DB + queue without a transaction strategy: write business row + outbox row atomically in Postgres, relay to BullMQ/broker; accept at-least-once and require idempotent consumers.

### Cited Findings
- Problem (Richardson/microservices.io): updating DB and sending broker message must be atomic; 2PC often unavailable/undesirable; send-during-tx may not commit; send-after-commit may crash before send; order across instances matters. — [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- Solution: store message in DB in same transaction as entities; separate Message Relay publishes to broker. Benefits: no 2PC; send iff commit; ordered publish. Issue: relay can publish duplicates → consumers must be idempotent (track message IDs). — same
- AWS: dual-write failure modes (DB ok / event fail, or reverse); outbox table + poller or CDC; duplicates expected → idempotent consumers; preserve order; never notify on rollback. — [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
- NestJS reliability docs (Node ecosystem): `Outbox.add()` in same txn; relay with backoff/DLQ; consumer inbox of processed IDs. — [NestJS outbox](https://docs.nestjs.com/reliability/outbox)

### Inferences
- Beta pattern: `BEGIN` → mutate domain (e.g. nota status) + insert `outbox` → `COMMIT` → worker/relay `queue.add` to BullMQ for geocode/scrape/email; mark outbox processed; handlers idempotent on `event_id` / business key.
- For simple fire-and-forget where losing an enqueue on crash is acceptable (rare), direct `queue.add` after commit is weaker; prefer outbox for email/geocode that must follow committed state.
- Domain events inside modular monolith can start as in-process module calls; introduce outbox when crossing process boundary (API → worker) or when reliability of “state change implies job” is mandatory.

### Gaps
- Canonical sources are broker-oriented (Kafka/SQS); BullMQ-as-relay target is a valid adaptation but not spelled as first-class in Richardson/AWS pages.
- Exact Postgres polling vs LISTEN/NOTIFY vs logical decoding choice for Beta not prescribed by a single primary source in this set.

## Mapping checklist → Beta (Express + Postgres + BullMQ)

### Takeaway
Operate Beta as a 12-factor modular monolith with hexagonal module edges, C4 Context/Container docs, Nygard ADRs, and production BullMQ + optional transactional outbox for reliable side effects.

### Cited Findings
- Process concurrency + backing services model from Twelve-Factor (web vs worker; Postgres/Redis as resources). — [Concurrency](https://www.12factor.net/concurrency); [Backing services](https://www.12factor.net/backing-services)
- Modular monolith as early-stage default. — [ThoughtWorks](https://www.thoughtworks.com/en-us/insights/blog/microservices/modular-monolith-better-way-build-software); [Monolith First](https://www.martinfowler.com/bliki/MonolithFirst.html)
- BullMQ production Redis/worker/idempotency requirements. — [Going to production](https://docs.bullmq.io/guide/going-to-production); [Idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs); [Workers](https://docs.bullmq.io/guide/workers)
- Outbox for DB+message atomicity. — [microservices.io outbox](https://microservices.io/patterns/data/transactional-outbox.html)

### Inferences
| Practice | Beta application |
|---|---|
| Modular monolith | Domain folders/modules; one deployable Express app + worker entrypoint |
| Hexagonal | Ports for repos/mail/geocode/scrape; adapters swap in tests |
| 12-factor | Env config; no local Redis/Postgres assumptions in code; stdout logs |
| BullMQ Redis | Dedicated instance, AOF, `noeviction` |
| Workers | Separate Node process; sandbox scraping; graceful shutdown |
| Jobs | Atomic idempotent handlers; exponential retries; `removeOnComplete` tuned |
| Reliability | Outbox table in Postgres for “commit ⇒ enqueue” |
| Docs | C4 Context+Container; ADR for queue/outbox/monolith decisions |

### Gaps
- Product-specific SLAs (email exactly-once vs at-least-once tolerance) need product decision, not architecture canon.
