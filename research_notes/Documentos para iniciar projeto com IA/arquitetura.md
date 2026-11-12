# Modern software architecture documentation standards (2024–2026)

## What documents are needed for starting a software/web project and building a solid prototype?

### Takeaway
A solid starter package is Architecture Overview (goals/context/strategy) + C4 Context/Container diagrams + ADRs for stack/significant choices + a living design doc; API contracts, data models, and threat models become mandatory as you approach production exposure, not always at first prototype.

### Cited Findings
- ThoughtWorks treats Lightweight Architecture Decision Records as Adopt: capture important architectural decisions with context and consequences, stored in source control so they stay in sync with code; much other documentation can be replaced by readable code and tests. — [ThoughtWorks Technology Radar: Lightweight Architecture Decision Records](https://www.thoughtworks.com/en-us/radar/techniques/lightweight-architecture-decision-records)
- Michael Nygard defines “architecturally significant” decisions as those that affect structure, non-functional characteristics, dependencies, interfaces, or construction techniques; ADRs are short modular files (not large specs). — [Documenting Architecture Decisions (Nygard, 2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- C4 provides hierarchical diagrams (System Context, Containers, Components, Code) plus supporting diagrams (landscape, dynamic, deployment); FAQ states top two levels are often enough for many teams, and C4 deliberately does **not** cover data models/workflows—those need supplemental ERDs/UML/etc. — [C4 model home](https://c4model.com/); [C4 FAQ](https://c4model.com/faq); [Simon Brown / DEV: You don’t need to use UML](https://dev.to/simonbrown/you-don-t-need-to-use-uml-4kaa)
- arc42 answers “what to document” with 12 optional/tailorable sections (Introduction & Goals through Glossary); teams can use a one-page “arc42 canvas” when twelve sections are too heavy. — [arc42 Template Overview](https://arc42.org/overview/)
- C4 maps cleanly onto arc42: Context & Scope → System Context; Building Block L1 → Container; L2 → Component; L3 → Code. — [C4 FAQ](https://c4model.com/faq)
- Google’s SWE practice: most teams require an approved design document before major work; templates force security, i18n, storage, privacy, trade-offs, and alternatives. — [Software Engineering at Google, Ch. 10 (Design Docs)](https://abseil.io/resources/swe-book/html/ch10.html)
- Google style guidance: “Minimum Viable Documentation” — a small set of fresh, accurate docs beats a large stale corpus; update docs in the same change as code; design docs become archives after implementation, not living half-truths. — [Google Documentation Best Practices](https://google.github.io/styleguide/docguide/best_practices.html)
- AWS Well-Architected reviews are lightweight conversations (hours, not days) at design milestones and before go-live, then after significant changes; they are not a substitute for project ADRs/diagrams but a production readiness lens across six pillars. — [AWS Well-Architected: The review process](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-review-process.html); [AWS Well-Architected Framework (2024-06-27 PDF)](https://docs.aws.amazon.com/pdfs/wellarchitected/2024-06-27/framework/wellarchitected-framework-2024-06-27.pdf)
- OpenAPI is the de facto machine-readable HTTP API interface description so humans and tools can understand a service without reading source; recommended entry docs named `openapi.json` / `openapi.yaml`. — [OpenAPI Specification v3.2.0](https://spec.openapis.org/oas/v3.2.0.html)
- A government reference architecture lists kickoff artifacts before production API exposure: API brief, version-controlled OpenAPI, consumer register, threat/exposure model, information schedule, NFR profile, test plan, operating pack, lifecycle plan. — [WA DTT: OpenAPI Backends reference architecture](https://adr.dtt.digital.wa.gov.au/reference-architectures/openapi-backends.html)
- OWASP: threat modeling ideally early in SDLC and maintained; answers four manifesto questions; ASVS Level 3 expects a high-level architecture and a STRIDE threat model. — [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html); [OWASP ASVS annotated docs (architecture/STRIDE)](https://owasp-aasvs.readthedocs.io/_/downloads/en/latest/pdf/)
- BCG “Minimum Viable Architecture”: architecture with just enough structure for initial launch, start simple/iterate, prefer “good enough,” invest early in data integrity. — [BCG: Minimum Viable Architecture in Product Development](https://www.bcg.com/x/the-multiplier/minimum-viable-architecture-in-product-development)
- Community template pattern: MVP/Prototype = Overview + Context + ADRs; Production service adds Building Blocks + Deployment + Crosscutting; Complex system = full template. — [foxcool/architecture-doc-template](https://github.com/foxcool/architecture-doc-template)

### Inferences
- Recommended **starter set for a web/software prototype**: (1) Architecture Overview / design doc, (2) C4 Context + Container, (3) ADRs for tech stack & irreversible choices, (4) sketch of data model (ERD or schema notes), (5) OpenAPI or equivalent only if there is an external/internal HTTP API boundary.
- **Defer or lighten until production path**: full arc42, Component/Code C4, formal threat model (unless handling auth/PII early), deployment/ops runbooks, full WAFR, consumer registers.
- Treat “system design doc” and “Architecture Overview” as the same living artifact early; promote sections into arc42 or dedicated files as complexity grows.

### Gaps
- No single 2024–2026 industry standard mandates an exact checklist of filenames for every startup project; guidance is consensus across frameworks, not a ISO-style required set.
- Quantitative survey data (what % of teams keep threat models in-repo vs wiki) was not located in this pass.

---

## What must each document contain (section checklists)?

### Takeaway
Use short, opinionated templates: Nygard/MADR for ADRs; C4 diagram content rules for structure views; Google/design-doc sections for proposals; OWASP four questions + DFD/STRIDE for threat models; OpenAPI paths/schemas/security for API contracts; arc42 sections when you need a complete architecture handbook.

### Cited Findings

#### Architecture Overview / Design Doc
- Effective design-doc structure: Metadata (author, date, status); Summary; Context/Background; Goals/Non-goals; Proposed design (diagrams, schemas, back-of-envelope); Alternatives considered (comparison table); cover security/privacy/scalability/observability as relevant. — [Effective design docs (mmapped.blog)](https://mmapped.blog/posts/31-effective-design-docs)
- Google-shaped design doc (practitioner synthesis): Title + metadata; Purpose; Background; Overview; Detailed design; Alternatives considered; secondary sections for test/deploy/monitor; Document history. — [Ryan Madden: Things I Learned at Google — Design Docs](https://ryanmadden.net/things-i-learned-at-google-design-docs/)
- Google SWE book: design docs should cover goals, implementation strategy, key decisions with trade-offs, and alternative designs with strengths/weaknesses; archive after approval. — [SWE at Google Ch. 10](https://abseil.io/resources/swe-book/html/ch10.html)
- Gerrit community design-doc split: use-cases + acceptance criteria + background; possible solutions with pros/cons; conclusion with chosen option and reasons. — [Gerrit Code Review — Design Docs](https://gerrit-review.googlesource.com/Documentation/dev-design-docs.html)

**Checklist — Architecture Overview / Design Doc**
- [ ] Title, authors, status (draft/review/accepted), last updated
- [ ] Problem / background (current state)
- [ ] Goals and non-goals
- [ ] Constraints (org, regulatory, time, existing systems)
- [ ] Proposed architecture (link C4 Context/Container)
- [ ] Key quality attributes (top 3–5)
- [ ] Tech stack summary + pointers to ADRs
- [ ] Main data flows / critical scenarios
- [ ] Alternatives considered + why rejected
- [ ] Risks / open questions
- [ ] Security/privacy notes (even brief at MVP)

#### Architecture Decision Records (ADRs)
- Nygard template: Title; Context; Decision; Status; Consequences; one decision per file; 1–2 pages; Markdown in `doc/arch/adr-NNN.md`. — [Nygard 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- ThoughtWorks playbook template: Title; Status; Context; Decision; Consequences; Alternatives considered; numbered Markdown under e.g. `doc/adr/NNNN-example.md`. — [ThoughtWorks Enterprise Architecture Playbook (PDF)](https://www.thoughtworks.com/content/dam/thoughtworks/documents/report/thoughtworks-enterprise-architecture-playbook.pdf)
- Martin Fowler (2026 bliki): short (≈1 page); decision + context + ramifications; inverted pyramid; store in repo (common `doc/adr`); Markdown; numbered filenames; statuses proposed/accepted/superseded; never rewrite accepted ADRs—supersede; list serious alternatives with pros/cons; optional confidence + reevaluation triggers. — [Martin Fowler: Architecture Decision Record](https://www.martinfowler.com/bliki/ArchitectureDecisionRecord.html)
- MADR full template (2024 v4): YAML front matter (status, date, decision-makers, consulted, informed); Context and Problem Statement; Decision Drivers; Considered Options; Decision Outcome (+ Consequences, Confirmation); Pros and Cons of the Options; More Information. Minimal template: Context; Considered Options; Decision Outcome + Consequences. Default folder `docs/decisions`, files `nnnn-title.md`. — [MADR template](https://github.com/adr/madr/blob/main/template/adr-template.md); [MADR site / About](https://adr.github.io/madr/); [adr/madr README](https://github.com/adr/madr/)
- Harmel-Law conversational ADR elements: title+id; status; decision; context; options considered; consequences; advice. — [Scaling the Practice of Architecture, Conversationally (martinfowler.com)](https://martinfowler.com/articles/scaling-architecture-conversationally.html)

**Checklist — ADR (lightweight / MVP)**
- [ ] Numbered filename + short title naming the decision
- [ ] Status (proposed | accepted | superseded | …)
- [ ] Context / forces / problem
- [ ] Decision (full sentences: “We will…”)
- [ ] Consequences (positive and negative)
- [ ] Alternatives considered (at least briefly)

**Checklist — ADR (full / MADR)**
- [ ] Front matter: status, date, decision-makers (± consulted/informed)
- [ ] Decision drivers
- [ ] Pros/cons per option
- [ ] Confirmation / fitness functions (ArchUnit, review, tests)
- [ ] Links to related ADRs / diagrams / tickets
- [ ] Confidence / revisit triggers (Fowler)

#### C4 diagrams
- Core hierarchy: Context → Containers → Components → Code; supporting: landscape, dynamic, deployment; notation- and tooling-independent. — [c4model.com](https://c4model.com/)
- Purpose of levels: Context = system in the world; Container = apps/data stores; Component = internals of a container; Code = optional implementation detail. — [C4 Introduction](https://c4model.com/introduction)
- Simon Brown: top two levels often sufficient; containers = deployable/runnable units (SPA, server app, microservice, DB schema—not Docker). — [DEV: You don’t need to use UML](https://dev.to/simonbrown/you-don-t-need-to-use-uml-4kaa)
- Scale tip: prefer multiple focused diagrams over one cluttered diagram; split by bounded context/feature. — [C4 FAQ](https://c4model.com/faq)

**Checklist — C4 System Context**
- [ ] System in scope (one box)
- [ ] Users / personas
- [ ] External systems
- [ ] Relationships labeled (why they interact)

**Checklist — C4 Container**
- [ ] Each deployable/runnable unit + technology choice
- [ ] Data stores
- [ ] Protocols / major interfaces between containers
- [ ] Responsibilities of each container

**Checklist — C4 Component (when needed)**
- [ ] Components inside one container
- [ ] Responsibilities and dependencies
- [ ] Audience: developers working in that codebase

**Checklist — Supporting**
- [ ] Dynamic diagram for critical runtime scenarios (optional early)
- [ ] Deployment diagram when infra matters (pre-prod)
- [ ] Supplemental ERD/sequence/state for data & workflows (C4 does not cover these) — [C4 FAQ](https://c4model.com/faq)

#### arc42 (full architecture handbook)
- Twelve sections with clear purposes. — [arc42 Overview](https://arc42.org/overview/); [INNOQ brief introduction](https://www.innoq.com/en/blog/2022/08/brief-introduction-to-arc42/)

**Checklist — arc42 sections**
1. Introduction & Goals — requirements extract; top 3–5 quality goals; stakeholders
2. Constraints — technical/org/regulatory limits
3. Context & Scope — boundaries, external interfaces (business ± technical)
4. Solution Strategy — fundamental decisions / approaches
5. Building Block View — static decomposition (L1 often enough)
6. Runtime View — few important scenarios
7. Deployment View — infra mapping
8. Crosscutting Concepts — patterns, domain model, tech usage rules
9. Architectural Decisions — ADRs or summary
10. Quality Requirements — quality tree + scenarios
11. Risks & Technical Debt
12. Glossary

#### API contracts
- OpenAPI describes HTTP API surface language-agnostically (paths, methods, schemas, security, examples). — [OAS v3.2.0](https://spec.openapis.org/oas/v3.2.0.html); [OpenAPI explained](https://learn.openapis.org/specification/)
- Production-oriented contract checklist: stable operation IDs; schemas; examples; errors; security declarations; CI validation / drift prevention; changelog & deprecation; synthetic examples only. — [WA DTT OpenAPI Backends](https://adr.dtt.digital.wa.gov.au/reference-architectures/openapi-backends.html)
- Separate generated reference (“what”) from hand-written guides (“why”). — [Contract-First API Development with OpenAPI (PgBeam)](https://pgbeam.com/blog/contract-first-api-development)

**Checklist — API contract (OpenAPI)**
- [ ] `openapi` version + `info` (title, version, description)
- [ ] `servers`
- [ ] `paths` with methods, parameters, requestBody, responses
- [ ] `components.schemas` for payloads
- [ ] Error responses for material failure modes
- [ ] `securitySchemes` / `security`
- [ ] Examples (non-sensitive)
- [ ] Versioning / compatibility policy (doc or ADR)
- [ ] CI check that prevents contract drift

#### Data models
- C4 explicitly recommends supplementing with ERDs / domain models when needed. — [C4 FAQ](https://c4model.com/faq)
- BCG MVA emphasizes data integrity/structure as foundation even when UI/API are simplified. — [BCG MVA](https://www.bcg.com/x/the-multiplier/minimum-viable-architecture-in-product-development)
- arc42 “Crosscutting Concepts” commonly holds domain models and persistence rules. — [arc42 Overview](https://arc42.org/overview/); [INNOQ arc42 intro](https://www.innoq.com/en/blog/2022/08/brief-introduction-to-arc42/)

**Checklist — Data model doc**
- [ ] Core entities / aggregates and relationships (ERD or equivalent)
- [ ] Ownership / bounded contexts
- [ ] Identifiers, uniqueness, soft-delete/versioning rules
- [ ] Sensitive fields & retention notes
- [ ] Source of truth vs derived/cached data
- [ ] Migration approach (even if “migrations in repo”)
- [ ] Link schemas in code / OpenAPI components

#### Threat models
- Manifesto four questions: What are we working on? What can go wrong? What are we going to do about it? Did we do a good enough job? — [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- System modeling via DFD: processes, data stores, external entities, data flows, trust boundaries. — [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html); [OWASP DevSecOps Guideline — Threat Modeling](https://owasp.github.io/DevSecOpsGuideline/2-Process/2-1-Design/2-1-1-Threat-modeling/)
- STRIDE categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege. — [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- Responses: mitigate, eliminate, transfer, accept; turn mitigations into testable security requirements; review with stakeholders; document formally. — [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- Privacy: LINDDUN when personal data; cloud: shared responsibility, IAM, managed services. — [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)

**Checklist — Threat model**
- [ ] Scope & assets (answer Q1; DFD or C4-informed diagram)
- [ ] Trust boundaries marked
- [ ] Threat list (STRIDE or chosen method) per component/flow/boundary
- [ ] Risk ranking (impact × likelihood or qualitative)
- [ ] Response per threat (mitigate/eliminate/transfer/accept)
- [ ] Security requirements / tickets from mitigations
- [ ] Residual risk owners
- [ ] Review date / next update trigger
- [ ] Formal storage location (repo path with access control as needed)

#### Tech stack decisions
- Capture as ADRs (Nygard significance criteria) and/or arc42 Solution Strategy + Crosscutting Concepts. — [Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions); [arc42 Overview](https://arc42.org/overview/)
- InfoQ framework: internal Technology Radar + Standards + ADRs for one-time choices. — [InfoQ: A Simple Framework for Architectural Decisions](https://www.infoq.com/articles/framework-architectural-decisions/)

**Checklist — Tech stack decision package**
- [ ] ADR per significant choice (language, framework, DB, hosting, auth, messaging)
- [ ] Drivers: team skill, time-to-MVP, ops burden, cost, compliance
- [ ] Alternatives rejected
- [ ] Operational consequences (who runs it, how observed)
- [ ] Optional: link to org radar/standards if they exist

### Inferences
- For prototypes, prefer Nygard/MADR-minimal ADRs + design-doc checklist + C4 Context/Container over filling all twelve arc42 sections.
- API + data + threat checklists scale with exposure: public internet + PII → full checklists before launch.

### Gaps
- Official C4 site pages fetched here emphasize hierarchy and FAQ more than a single canonical “element label checklist”; diagramming conventions are detailed further in Simon Brown’s book/tooling docs not fully extracted in this pass.
- No single canonical “data model documentation standard” equivalent to OpenAPI/ADR/C4 was found; practice is ERD + schema-in-repo + arc42 concepts.

---

## Current best practices from ThoughtWorks, Martin Fowler, arc42, C4, AWS Well-Architected, Google SWE?

### Takeaway
Consensus across these sources: keep architecture docs lean and close to code; record irreversible/significant decisions as ADRs; visualize structure with C4 (often Context+Container); use arc42 when you need a complete handbook; use Google-style design docs for major changes; use AWS Well-Architected as a production risk conversation—not as day-one paperwork.

### Cited Findings
- **ThoughtWorks Radar**: Lightweight ADRs in source control with markup; prefer over wiki-only for sync with code; “for most projects, we see no reason why you wouldn't want to use this technique.” — [TW Radar: Lightweight ADRs](https://www.thoughtworks.com/en-us/radar/techniques/lightweight-architecture-decision-records)
- **ThoughtWorks**: Architecture Advice Process — anyone may decide if they seek advice from affected people and experts; ADRs + advisory forums replace heavy Architecture Review Boards (linked to DevOps research on ARBs hurting performance). — [TW Radar: Architecture advice process](https://www.thoughtworks.com/radar/techniques/architecture-advice-process)
- **ThoughtWorks EA Playbook**: ADRs 15–60 minutes; can replace heavier governance when combined with principles and trust; automate publish from git. Template sections listed above. — [EA Playbook PDF](https://www.thoughtworks.com/content/dam/thoughtworks/documents/report/thoughtworks-enterprise-architecture-playbook.pdf)
- **Martin Fowler**: ADRs clarify thinking and preserve history; Markdown in `doc/adr`; supersede don’t edit; brevity first; optional Advice Process linkage. — [Fowler ADR bliki (24 Mar 2026)](https://www.martinfowler.com/bliki/ArchitectureDecisionRecord.html); [Scaling architecture conversationally](https://martinfowler.com/articles/scaling-architecture-conversationally.html)
- **arc42**: Pragmatic 12-section template, free/commercial use, tailor depth; canvas for one-page; C4-compatible building-block views. — [arc42 Overview](https://arc42.org/overview/)
- **C4 (Simon Brown)**: Developer-friendly hierarchical maps; not a mandated process/roles; compatible with arc42; supplement for data/process views. — [c4model.com](https://c4model.com/); [C4 FAQ](https://c4model.com/faq)
- **AWS Well-Architected (2024 updates)**: Six pillars (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability); review early to avoid one-way doors; before go-live; after major changes; conversation not audit; capture notes/context. Major guidance refresh Nov 2024. — [Review process](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-review-process.html); [Document revisions](https://docs.aws.amazon.com/wellarchitected/latest/framework/document-revisions.html); [Framework PDF 2024-06-27](https://docs.aws.amazon.com/pdfs/wellarchitected/2024-06-27/framework/wellarchitected-framework-2024-06-27.pdf)
- **Google SWE book**: Approved design doc before major projects; collaborative review; force security/privacy/i18n/storage; archive and re-check goals at launch. — [SWE at Google Ch. 10](https://abseil.io/resources/swe-book/html/ch10.html)
- **Google doc style**: Prefer small living docs; update with code; treat post-implementation design docs as historical archives. — [Google Documentation Best Practices](https://google.github.io/styleguide/docguide/best_practices.html)
- **MADR 4.0.0 (2024-09-17)**: Modern Markdown ADR standard with bare/minimal/full templates; still actively maintained. — [adr.github.io/madr](https://adr.github.io/madr/)

### Inferences
- These authorities converge on **evolutionary architecture documentation**: write just enough, version with code, emphasize *why* (ADRs) and *structure* (C4), expand toward arc42/WAFR/threat models as risk and scale grow.
- Lightweight alternatives to “full architecture docs”: Architecture Haiku (mentioned in ADR template literature), arc42 canvas, MADR-minimal, Context+Container only, single design doc. — [pmerson/ADR-template references Haiku](https://github.com/pmerson/ADR-template); [arc42 canvas mention](https://arc42.org/overview/)

### Gaps
- Azure Well-Architected / Google Cloud Architecture Framework were not deep-fetched in this pass; AWS was used as the cloud WA primary.
- ThoughtWorks Technology Radar volumes after the classic Lightweight ADR “Adopt” entry evolve technique names; the advice-process blip is the newer companion practice—teams should check the latest radar volume for status changes.

---

## What is enough for MVP/prototype vs production?

### Takeaway
MVP docs optimize for shared understanding and reversible decisions; production docs add contracts, threat/ops readiness, deployment views, and formal reviews—without requiring a complete arc42 on day one.

### Cited Findings
- BCG MVA: just enough architecture for launch; crawl-first hosting (PaaS/FaaS before Kubernetes); familiar stack; “good enough”; prioritize data platform robustness. — [BCG MVA](https://www.bcg.com/x/the-multiplier/minimum-viable-architecture-in-product-development)
- Simon Brown: Context + Container often enough for many teams; Component/Code optional. — [DEV article](https://dev.to/simonbrown/you-don-t-need-to-use-uml-4kaa)
- arc42: stick to Building Block level-1 when sufficient; keep few runtime scenarios. — [INNOQ arc42 intro](https://www.innoq.com/en/blog/2022/08/brief-introduction-to-arc42/)
- Google: Minimum Viable Documentation; design docs for significant changes, then archive. — [Google doc best practices](https://google.github.io/styleguide/docguide/best_practices.html)
- AWS: more inspection for one-way doors; lightweight process for two-way doors; WAFR before go-live and after major changes. — [AWS review process](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-review-process.html)
- WA DTT: extensive kickoff artifacts **before production exposure** of APIs (threat model, operating pack, NFRs, lifecycle). — [OpenAPI Backends](https://adr.dtt.digital.wa.gov.au/reference-architectures/openapi-backends.html)
- OWASP: threat model early ideally, but ASVS L3 STRIDE is a higher maturity bar; maintain model as system changes. — [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html); [ASVS annotated](https://owasp-aasvs.readthedocs.io/_/downloads/en/latest/pdf/)
- Scalable detail pattern: MVP = Overview + Context + ADRs; Production = add Building Blocks + Deployment + Crosscutting; Complex = full. — [foxcool/architecture-doc-template](https://github.com/foxcool/architecture-doc-template)

### Inferences

| Artifact | MVP / prototype | Production |
|---|---|---|
| Architecture Overview / design doc | Required (short) | Required (updated or archived+links) |
| ADRs | Required for stack & one-way doors | Required + supersession discipline |
| C4 Context + Container | Required | Required |
| C4 Component / Code | Optional | As needed for complex containers |
| C4 Deployment / Dynamic | Optional | Strongly recommended |
| OpenAPI / API contracts | If API boundary exists (draft OK) | Required + CI drift checks |
| Data model | Sketch/ERD | Schema + ownership + retention |
| Threat model | Light checklist if auth/PII; else defer | Formal DFD+STRIDE (+ privacy) |
| arc42 full | Optional (canvas OK) | Selective fill of needed sections |
| AWS WAFR / cloud review | Skip or informal | Before go-live + after major changes |
| Ops runbooks / SLOs | Minimal | Required for exposed services |

### Gaps
- “Production” thresholds vary by regulated industry; this pass did not dig into PCI/HIPAA-specific architecture doc mandates beyond OWASP/ASVS pointers.

---

## How do modern teams keep architecture docs AI-readable (Markdown in repo, ADRs in /docs)?

### Takeaway
Store architecture knowledge as versioned Markdown (and OpenAPI YAML) beside code, with stable paths and indexes; ADRs in `doc/adr`, `docs/decisions`, or similar; optionally expose `llms.txt` / raw Markdown for agents—HTML-only wikis are a poor fit for AI context.

### Cited Findings
- Fowler: keep ADRs in the product source repository; common location `doc/adr`; lightweight markup (Markdown) so they are readable and diffable like code; publish via build if needed. — [Fowler ADR](https://www.martinfowler.com/bliki/ArchitectureDecisionRecord.html)
- ThoughtWorks: store ADRs in source control instead of (only) wiki/website so they remain synchronized with code. — [TW Radar Lightweight ADRs](https://www.thoughtworks.com/en-us/radar/techniques/lightweight-architecture-decision-records)
- Nygard: Markdown/Textile under `doc/arch/adr-NNN.md`; GitHub renders Markdown like a wiki while staying in VCS. — [Nygard 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- MADR: copy templates into `docs/decisions`; files `nnnn-title.md`; YAML front matter for status/date/decision-makers. — [adr/madr](https://github.com/adr/madr/); [MADR about](https://adr.github.io/madr/)
- Vercel AI ADR skill conventions (2025-style agent guidance): prefer existing ADR dirs; else `docs/decisions/` or `adr/`; detect common paths; for agent-first ADRs make constraints measurable, state non-goals, list follow-ups; YAML status required. — [vercel/ai adr-conventions.md](https://github.com/vercel/ai/blob/main/skills/adr-skill/references/adr-conventions.md)
- Academic/agentic studio guidance: ADRs exist so agents in fresh sessions can read *why*, not only *what* code shows; keep one file per decision in-repo. — [ANU Agentic Coding Studio: Decision records](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/decision-records/)
- `llms.txt` (Jeremy Howard, 2024): site/path Markdown index for LLMs with links to detailed Markdown pages (`page.md` or `.html.md`); keeps entry small, details fetchable. — [llmstxt.org](https://llmstxt.org/index.md)
- Decision-archive example: publish `/llms.txt` listing raw Markdown ADRs + `/llms-full.txt` of full bodies; HTML is a poor feed for coding assistants. — [Inkan ADR 0001: llms.txt](https://useinkan.dev/ai/adr/0001-llms-txt-and-llms-full-txt/)
- Google: if docs live outside the repo (Sites/Drive/wiki), link them clearly from `README.md`; still prefer docs updated with code changes. — [Google Documentation Best Practices](https://google.github.io/styleguide/docguide/best_practices.html)
- OpenAPI YAML/JSON in VCS is inherently machine- and AI-readable contract text. — [OAS v3.2.0](https://spec.openapis.org/oas/v3.2.0.html)

### Inferences
- Practical AI-friendly layout for a new web project:
  - `README.md` → links to architecture index
  - `docs/architecture/overview.md` (design doc)
  - `docs/architecture/c4/` (or Structurizr/DSL sources that generate diagrams)
  - `docs/decisions/` or `doc/adr/` (MADR/Nygard ADRs)
  - `docs/api/openapi.yaml`
  - `docs/data/model.md` (+ schema migrations in code)
  - `docs/security/threat-model.md` (when needed)
  - optional `llms.txt` or `docs/llms.txt` indexing the above
- Prefer text-first diagram sources (Mermaid, Structurizr DSL, PlantUML) checked into git over binary-only Visio/draw.io blobs when AI/agents must consume them—though C4 itself is tooling-independent ([c4model.com](https://c4model.com/)).
- Front matter (status, date) improves both human skimming and agent filtering of “current” vs superseded decisions.

### Gaps
- No widely adopted single standard for “architecture llms.txt schema” beyond the generic llms.txt proposal and individual project ADRs.
- Empirical benchmarks comparing agent performance with ADRs vs without were not found in this research pass.

---

## Source index (primary)

| Source | URL |
|---|---|
| C4 model | https://c4model.com/ |
| C4 FAQ | https://c4model.com/faq |
| arc42 overview | https://arc42.org/overview/ |
| docs.arc42.org (section docs) | https://docs.arc42.org/ |
| Nygard ADRs (2011) | https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions |
| Fowler ADR (2026) | https://www.martinfowler.com/bliki/ArchitectureDecisionRecord.html |
| MADR | https://adr.github.io/madr/ |
| ADR collection repo | https://github.com/architecture-decision-record/architecture-decision-record |
| ThoughtWorks Lightweight ADRs | https://www.thoughtworks.com/en-us/radar/techniques/lightweight-architecture-decision-records |
| ThoughtWorks Advice Process | https://www.thoughtworks.com/radar/techniques/architecture-advice-process |
| ThoughtWorks EA Playbook | https://www.thoughtworks.com/content/dam/thoughtworks/documents/report/thoughtworks-enterprise-architecture-playbook.pdf |
| Google SWE Ch. 10 | https://abseil.io/resources/swe-book/html/ch10.html |
| Google doc best practices | https://google.github.io/styleguide/docguide/best_practices.html |
| AWS Well-Architected review process | https://docs.aws.amazon.com/wellarchitected/latest/framework/the-review-process.html |
| OWASP Threat Modeling Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html |
| OpenAPI Spec | https://spec.openapis.org/oas/v3.2.0.html |
| llms.txt | https://llmstxt.org/index.md |
| BCG Minimum Viable Architecture | https://www.bcg.com/x/the-multiplier/minimum-viable-architecture-in-product-development |
