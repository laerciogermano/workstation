# <System name>: Architecture

> Fonte: https://www.archyl.com/blog/software-architecture-documentation-template (lean, C4 + ADRs). Coleção local 2026-11-08.

| | |
|---|---|
| Owner | <team or person accountable for keeping this true> |
| Last reviewed | <YYYY-MM-DD> |
| Next review | <YYYY-MM-DD, or "on every change to sections 3-5"> |
| Status | <draft / current / being replaced by X> |

## 1. Context and scope

<Two or three sentences: what the system does, for whom, and why it exists.>

**Users**
- <Role>: <what they do with the system>

**External systems**
- <System>: <what we send or receive, protocol>

**Out of scope**
- <Things people assume this system does but it doesn't>

**System context diagram (C4 level 1)**
<Link or embed. The system as one box, every kind of user, every external system.>

## 2. Quality goals

The three to five qualities that win when they conflict with each other, in priority order.

| Priority | Quality | Concrete scenario |
|---|---|---|
| 1 | <e.g. Availability> | <e.g. Checkout keeps working when the recommendation service is down> |
| 2 | <e.g. Latency> | <e.g. p95 checkout under 2 s at 500 orders/minute> |
| 3 | <e.g. Changeability> | <e.g. A new payment method ships without touching the order service> |

## 3. Constraints

Things we didn't choose but have to live with.
- <e.g. Runs on the company Kubernetes platform>
- <e.g. Customer data stays in the EU>
- <e.g. Backend services in Go or Java only>

## 4. Architecture

**Container diagram (C4 level 2)**
<Link or embed. Every deployable unit and data store, with technology and protocols.>

| Container | Technology | Responsibility | Owner |
|---|---|---|---|
| <Web app> | <React SPA> | <What it does> | <Team> |
| <API> | <Go> | <What it does> | <Team> |
| <Database> | <PostgreSQL> | <What it stores> | <Team> |

**Component diagrams (C4 level 3)**
<Only for the one or two containers a newcomer would struggle with. Link or embed.>

**Key flows**
<The two or three scenarios that matter most, as numbered steps or a C4 dynamic diagram.>

1. <Actor> -> <Container>: <what happens>
2. <Container> -> <Container>: <what happens, protocol, sync or async>

## 5. Key decisions

Full records live in <docs/adr/>. This is the index.

| ADR | Decision | Status | Date |
|---|---|---|---|
| [ADR-001](adr/001-<slug>.md) | <e.g. One database per service> | Accepted | <YYYY-MM-DD> |
| [ADR-002](adr/002-<slug>.md) | <e.g. Kafka for order events> | Accepted | <YYYY-MM-DD> |

## 6. Crosscutting concerns

How the whole system handles things every container touches. One or two lines each, with a link to detail.
- **Authentication and authorization:** <where it happens, what token>
- **Observability:** <logs, metrics, traces, where to look>
- **Error handling and retries:** <conventions, idempotency>
- **Data and privacy:** <PII locations, retention>

## 7. Deployment and operations

- **Environments:** <production, staging, ...> and how they differ
- **Where it runs:** <cloud, region, cluster>
- **Runbooks:** <link>
- **Dashboards and alerts:** <link>

## 8. Risks and technical debt

| Risk or debt | Impact if it bites | Plan | Owner |
|---|---|---|---|
| <e.g. Stock reserved before payment, no compensation> | <Phantom reservations after payment failures> | <Add release on failure, Q4> | <Team> |

## 9. Glossary

| Term | Meaning here |
|---|---|
| <Order> | <Definition as the business uses it> |
