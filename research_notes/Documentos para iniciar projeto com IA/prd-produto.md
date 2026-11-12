# Modern PRD / product specification standards (2024–2026)

## What sections must a modern PRD have?

### Takeaway
Modern consensus is a **lean, problem-first checklist**, not a 30-page waterfall contract: problem + evidence, audience, goals/non-goals, success metrics, assumptions/risks, solution sketch (stories or scenarios), and open questions—kept to ~1 page for most features, expanding only when risk/regulation demands it.

### Cited Findings
- One-pager essentials (Product Consortium, Aug 2025): problem (1 sentence), success metrics (2–3), user stories (3–5), key assumptions, mockups/diagrams if helpful, explicit out-of-scope; “if it does not fit on one page, you are over-specifying.” — [The PRD Is Dead](https://www.theproductconsortium.com/articles/product-101-prd-is-dead)
- Lenny Rachitsky 1-pager questions (still foundational; mirrored in Atlassian Confluence template): Description, Problem, Why (evidence), Success, Audience, What (product shape). — [Lenny’s Product Requirements (Confluence)](https://www.atlassian.com/software/confluence/templates/lennys-product-requirements); original framing in [A Three-Step Framework For Solving Problems](https://www.lennysnewsletter.com/p/a-three-step-framework-for-solving)
- Atlassian Confluence PRD template sections: basics/team/status/release; Objective; Success metrics; Assumptions; Options/requirements table (with user story + importance + Jira); Supporting docs (mockups); Open questions; Out of scope. — [Atlassian PRD template](https://www.atlassian.com/software/confluence/templates/product-requirements)
- Notion (Aug 2024): minimum shared compass = clear problem statement, specific target audience, supporting evidence, rough launch timeline; treat PRD as living, syncable doc. — [Mastering the Art of the PRD](https://www.notion.com/blog/mastering-the-art-of-the-prd)
- Linear (Nan Yu, late 2024): only **3 sections**—Context (stable why/win), Usage scenarios (real anchored narratives), Milestones (living checkpoints/de-risk order). Principles: highest→granular; widest audience→narrower; least changeable→most changeable. — [LinkedIn / Nan Yu](https://www.linkedin.com/posts/thenanyu_linear-example-prd-priority-micro-adjust-activity-7264312237106860033-ndt5); summarized in [Hustle Badger PRD examples](https://www.hustlebadger.com/what-do-product-teams-do/prd-template-examples/)
- resetDocs best practices: problem before solution; measurable time-bound metrics; MoSCoW prioritization; edge cases; assumptions/open questions; ~15 min read; keep updated with changelog. — [10 Best Practices for Creating Effective PRDs](https://resetdocs.com/blog/prd-best-practices)
- Figma resource library lists broader classic set (overview, purpose/use cases, features, personas/stories, flows, release criteria, risks, NFRs, assumptions/dependencies, evaluation/metrics) while also saying a **one-page PRD is ideal** and the doc is living. — [Figma: How To Create a PRD](https://www.figma.com/resource-library/product-requirements-document/)
- Mind the Product argues **checklist by stage** (planning → kickoff → solution review → launch readiness → impact review) over a static filled template. — [Ditch the PRD template and embrace the PRD checklist](https://www.mindtheproduct.com/ditch-the-prd-template-and-embrace-the-prd-checklist/)
- Productboard product brief (pre-PRD) components: Problem, Target users, Strategic alignment, Current state, Success criteria, Constraints/assumptions, Open questions (+ next discovery steps); aim 1–2 pages. — [Productboard: Product Brief](https://www.productboard.com/glossary/product-brief/)
- Reforge PRD skeleton: Feature Opportunity (Strategic Fit, User Value Map, Business Value, Dependencies, Constraints) then Feature Design (Design Description & Prototype); explicitly “not set in stone.” — [Reforge PRD template](https://www.reforge.com/artifacts/prd-template-from-reforge)
- Amplitude: product **one-pager** before design cycle; page limits enforce clarity; must outline non-objectives and risky assumptions; readable in ~3 minutes. — [Amplitude: Learn How to Write Good Product Docs](https://amplitude.com/blog/product-docs)
- AI-specific additions (OpenAI Product Lead Miqdad Jaffer template, Mar 2025): Executive summary; Market opportunity; Strategic alignment; Customer & user needs; Value proposition; Features/capabilities; AI-specific considerations; Technical requirements; GTM; Success metrics; Risks—as a **living** alignment tool across PRMs. — [AI PRD Template (Product Compass)](https://www.productcompass.pm/p/ai-prd-template)
- AI feature hard sections often missing from classic PRDs: **eval thresholds**, **fallback behavior**, **behavioral constraints** (what the system must never do). — [Adaline Labs: Your AI PRD Is Missing Its Hardest Sections](https://labs.adaline.ai/p/ai-prd-missing-sections)

**Actionable must-have checklist (synthesis of above):**
1. Problem statement (solution-agnostic, 1 sentence)
2. Evidence / “why now” (data, quotes, competitive context)
3. Audience / persona or segment
4. Goals + **non-goals**
5. Success metrics (primary + guardrails)
6. Assumptions, risks, open questions
7. Scope: in/out + priority (P0/MoSCoW)
8. Solution sketch: scenarios / stories / prototype links (not a novel)
9. Dependencies / constraints
10. (Scale as needed) milestones, analytics events, launch/GTM, NFRs, AI evals

### Inferences
- “Must have” today means **decision quality + shared alignment**, not exhaustive feature enumeration; length scales with risk (regulated / multi-team / AI behavior contracts), not vanity completeness.
- Stable vs living split (Linear) is a useful design principle: lock the *why*; let build order and detail churn.

### Gaps
- No single ISO-style “standard” for PRD sections; company templates diverge. Stripe and Airbnb do not publish a canonical public PRD template comparable to Linear/Amazon PR/FAQ.
- Productboard’s public glossary page fetch timed out in this pass; findings rely on search-indexed content of that page.

---

## How do Productboard, Linear, Notion, Stripe, Airbnb, Google, Amazon, OpenAI, Anthropic, or well-known PMs structure product docs?

### Takeaway
Top teams converge on **short narrative + living updates**, but formats differ by stage: Amazon PR/FAQ for “should we build?”, Linear 3-section living PRD for execution, Amplitude/Lenny one-pagers for problem clarity, OpenAI-style richer AI PRDs for alignment at scale, Anthropic leaning **prototype/evals over long specs**.

### Cited Findings

**Linear**
- Structure: Context → Usage scenarios → Milestones; Context shouldn’t change; Milestones change a lot. Real example shared publicly Nov 2024; praised for ~5-minute readability and writing changelog/outcomes before build. — [Nan Yu LinkedIn](https://www.linkedin.com/posts/thenanyu_linear-example-prd-priority-micro-adjust-activity-7264312237106860033-ndt5); [Xiyuan Liu commentary](https://www.linkedin.com/posts/zeroliu_linear-example-prd-priority-micro-adjust-activity-7266909154630344706-4uqt); [Hustle Badger](https://www.hustlebadger.com/what-do-product-teams-do/prd-template-examples/)

**Notion**
- Product team advice (Aug 2024): use gallery templates; include problem, audience, evidence, timeline; leave room to grow; collaborate early; living docs via databases/synced blocks. — [Notion blog](https://www.notion.com/blog/mastering-the-art-of-the-prd)
- Marketplace hosts Lenny’s Product 1-Pager template. — [Notion Marketplace](https://www.notion.com/templates/product-1-pager-template)

**Productboard**
- Distinguishes **Product Brief** (why / opportunity / discovery) → **PRD** (what) → **Product Spec** (how). Brief: problem, users, strategic alignment, current state, success criteria, constraints/assumptions, open questions, next steps; 1–2 pages. Portal users request one-pager/product-brief board templates (Sep 2024). — [Productboard glossary](https://www.productboard.com/glossary/product-brief/); [Productboard Portal board templates](https://portal.productboard.com/pb/1-productboard-portal/c/747--board-templates)

**Amplitude**
- Culture of concise docs; “Product one-pager” before design; page limit; non-objectives + risky assumptions; comment culture; doc types scale as org grows. — [Amplitude product docs](https://amplitude.com/blog/product-docs)

**Reforge / well-known PMs**
- Reforge PRD: opportunity (fit, user value, business value, deps, constraints) + design/prototype. Natalie Rothfels toolkit: Product Brief, Product Spec, full PRD—use pragmatically, not as exhaustive checklist. — [Reforge PRD](https://www.reforge.com/artifacts/prd-template-from-reforge); [Rothfels toolkit](https://www.reforge.com/artifacts/example-prd-toolkit-by-natalie-rothfels)
- Lenny (ex-Airbnb) collects templates: his 1-pager; Kevin Yien (Square); Asana brief; Intercom job story / “Intermission” (≤1 page, no solution in doc); Product Hunt (long); Figma (comprehensive launch); Amazon PR/FAQ. — [Lenny favorite templates](https://www.lennysnewsletter.com/p/my-favorite-templates-issue-37); [Hustle Badger roundup](https://www.hustlebadger.com/what-do-product-teams-do/prd-template-examples/)

**Amazon**
- Working Backwards: **PR/FAQ**—press release (<1 page) + FAQ (≤~5 pages); customer-first; many drafts; most never ship (feature, not bug); living after approval. Official cultural description. — [About Amazon: Working Backwards](https://www.aboutamazon.com/news/workplace/an-insider-look-at-amazons-culture-and-processes)
- PR/FAQ answers “should we build?”; PRD answers “how do we build?”—sequential, not substitutes. — [PR/FAQ vs PRD](https://workingbackwards.theresonance.studio/compare/pr-faq-vs-prd); [productinterview.com](https://productinterview.com/frameworks/pr-faq/)

**Google**
- Secondary synthesis: collaborative internal wikis, living docs, **no forced single template**—format depends on initiative. — [Docs culture at Amazon, Google, Meta, Stripe, Anthropic](https://twocentspm.substack.com/p/docs-culture-at-amazon-google-and)

**Stripe / Airbnb**
- OnAssemble and similar blogs claim Stripe/Notion/Shopify/Airbnb adapted Working Backwards ideas; Airbnb heritage is strongly associated with Lenny’s problem-first 1-pager, not a public Airbnb PRD PDF. — [Working Backwards Amazon PR/FAQ](https://www.onassemble.com/blog/working-backwards-amazon-s-pr-faq-template); Lenny Airbnb-context framing in [Three-Step Framework](https://www.lennysnewsletter.com/p/a-three-step-framework-for-solving)
- Stripe docs culture mentioned in comparative Substack (fail-fast balance) without a published PRD schema. — [twocentspm](https://twocentspm.substack.com/p/docs-culture-at-amazon-google-and)

**OpenAI**
- Product Lead Miqdad Jaffer publishes a detailed **AI PRD** as primary alignment artifact across strategy, product/tech, GTM; living document / continuous PRM. Sections include market, strategy, JTBD/needs, value prop, features, AI considerations, tech, GTM, metrics, risks. — [AI PRD Template](https://www.productcompass.pm/p/ai-prd-template)
- Contrast claim: at OpenAI scale, written behavior contracts matter more than “prototype only.” — [Adaline Labs](https://labs.adaline.ai/p/ai-prd-missing-sections)
- CPO conversation (Weil): early experiments aim at demos; product/research co-design; evals gate quality. — [Caddie / Weil–Krieger conversation](https://usecaddie.app/s/a-conversation-with-openais-cpo-kevin-weil)

**Anthropic**
- Comparative claim: short docs + empirical results; relatively light bureaucracy to start initiatives. — [twocentspm](https://twocentspm.substack.com/p/docs-culture-at-amazon-google-and)
- Reported Labs practice (Dan Carey / Claude Design): prototypes effectively replace PRDs; talk *why* not *what*; generate multiple prototype options; skip pre-written vision/OKR theater for spark-driven builds. — [Howardism: Prototype Over PRD](https://www.howardism.dev/articles/prototype-over-prd)
- Krieger/Weil conversation: feature quality gated on evals and prompts; PMs write evals. — [Caddie conversation](https://usecaddie.app/s/a-conversation-with-openais-cpo-kevin-weil)

**Intercom / Asana / others (via template roundups)**
- Intercom “Intermission” / job story: ≤A4 page; do not add the solution; plain English. Asana: strong problem/hypothesis + non-goals + narrative vision, light on solution. — [Hustle Badger](https://www.hustlebadger.com/what-do-product-teams-do/prd-template-examples/)

**GitHub / open-source popularity (2024–2025)**
- Traditional PRD template repos exist but modest stars (e.g. opulo-inc/prd-template). — [opulo-inc/prd-template](https://github.com/opulo-inc/prd-template)
- High traction: **PRP (Product Requirement Prompts)** = PRD + codebase context + validation loops for AI agents (~2k+ stars). — [Wirasm/PRPs-agentic-eng](https://github.com/Wirasm/PRPs-agentic-eng)
- AI-native PRD templates emphasize model boundaries, HITL, eval plans. — [vittobh/prd-templates](https://github.com/vittobh/prd-templates/blob/main/README.md)
- ugur10/prd-template (Oct 2025): executive summary, background, goals/metrics, personas, requirements, NFRs, risks, post-launch; living-doc lifecycle. — [ugur10/prd-template](https://github.com/ugur10/prd-template)

### Inferences
- Format maps to company maturity and domain risk: consumer AI labs → prototype/eval-heavy; large platforms → written contracts; Amazon → narrative decision docs before build; Linear-style startups → ultra-short living PRDs.
- “How top teams write them now” ≈ **problem clarity first, solution last, living middle**.

### Gaps
- No primary public Stripe or Airbnb internal PRD template found; Airbnb association is mostly via Lenny’s public templates.
- Google/OpenAI/Anthropic internal standards are mostly secondhand (blogs, podcasts, Substacks)—treat as directional, not official policy docs.
- Exact Linear Google Doc example URL was referenced but not fully retrieved in this pass.

---

## Difference between PRD, product brief, problem statement, user stories, job stories, acceptance criteria, success metrics?

### Takeaway
These are **different layers of abstraction**: brief/problem ask *why/whether*; PRD asks *what we’re committing to*; stories frame opportunity; acceptance criteria define *done for a slice*; success metrics define *outcome after ship*.

### Cited Findings

| Artifact | Primary question | Typical timing | Notes / sources |
|---|---|---|---|
| **Product brief** | Why work on this opportunity? | Discovery / before commit | Problem-focused, lightweight; not how to build. — [Productboard](https://www.productboard.com/glossary/product-brief/); Reforge brief/spec/PRD ladder — [Rothfels](https://www.reforge.com/artifacts/example-prd-toolkit-by-natalie-rothfels) |
| **Problem statement** | What need is unmet, for whom, why it hurts? | Start of any initiative | Short, focused, solution-agnostic; JTBD-friendly. — [Lenny](https://www.lennysnewsletter.com/p/a-three-step-framework-for-solving); Product Talk — [product-requirements](https://www.producttalk.org/product-requirements/) |
| **PR/FAQ** (Amazon) | Should we build this? | Pre-resource decision | Press release + FAQ; customer narrative. — [About Amazon](https://www.aboutamazon.com/news/workplace/an-insider-look-at-amazons-culture-and-processes); [PR/FAQ vs PRD](https://workingbackwards.theresonance.studio/compare/pr-faq-vs-prd) |
| **PRD / product requirements** | What are we building and why (execution alignment)? | After problem validated / when building | Solution-focused enough for teams; living. — Productboard brief vs PRD vs spec; Atlassian/Notion/Linear |
| **Product spec** | How exactly does it work? | Implementation | More implementation detail than PRD. — [Productboard](https://www.productboard.com/glossary/product-brief/) |
| **User story** | As a [role], I want [capability], so that [benefit] | Backlog / sprint planning | Persona-centered; often encodes a solution; pairs with AC. Origin XP/Mike Cohn era. — [Koji comparison](https://www.koji.so/docs/job-stories-vs-user-stories); [Product Talk](https://www.producttalk.org/product-requirements/) |
| **Job story** | When [situation], I want to [motivation], so I can [outcome] | Discovery / research / Intercom-style briefs | Situation-centered; avoids premature solution; Intercom popularized (~2013). — [Koji](https://www.koji.so/docs/job-stories-vs-user-stories); [Mountain Goat](https://www.mountaingoatsoftware.com/agile/user-stories/not-everything-needs-to-be-a-user-story); Intercom Intermission in [Hustle Badger](https://www.hustlebadger.com/what-do-product-teams-do/prd-template-examples/) |
| **Acceptance criteria** | When is *this story* acceptably done? | Per story / before build of that slice | Testable conditions; Given/When/Then or rules checklist; ≠ Definition of Done (DoD is universal quality bar). — [monday.com](https://monday.com/blog/rnd/user-story-template/); [Dovetail](https://dovetail.com/product-development/what-is-acceptance-criteria/) |
| **Success metrics** | Did we solve the problem / move the business? | Defined before build; measured after | Outcomes not output; ideally primary + guardrails. — Lenny; Amplitude; Product Consortium one-pager |

- Recommended sequence from job-story advocates: **discover with job stories → build with user stories + AC**. — [Koji](https://www.koji.so/docs/job-stories-vs-user-stories)
- One-pager vs PRD vs PR/FAQ: one-pager = early briefing; PR/FAQ = go/no-go; PRD = delivery requirements. — [productinterview.com](https://productinterview.com/frameworks/pr-faq/)

### Inferences
- Confusion often comes from stuffing all layers into one mega-doc; modern practice **splits by stage** (brief → one-pager/PRD → stories/AC → metrics review).
- Non-goals are as important as goals for preventing brief/PRD/story scope bleed.

### Gaps
- Naming varies wildly (“spec”, “brief”, “intermission”, “initiative doc”); always map by *question answered*, not label.
- No authoritative Stripe/Airbnb glossary distinguishing these terms publicly.

---

## What is essential for building a prototype vs full production?

### Takeaway
**Prototype** specs optimize for learning (problem, scenarios, success of the learning goal); **MVP/production** specs add integrity: end-to-end workflow, security, failure modes, observability, and measurable outcomes—without requiring full feature completeness.

### Cited Findings
- SVPG: prototypes ≠ products; commercial products add runtime complexity—reliability, telemetry, scale, i18n, integrations, zero-downtime, fault tolerance, security, compliance, DR. — [SVPG: Prototypes vs Products](https://www.svpg.com/prototypes-vs-products/)
- Prototype may include hard-coded data, incomplete workflows, temporary integrations, limited error handling, no permissions/backups/monitoring; danger is silently promoting prototype to live. — [Prototype, MVP, and Production Product](https://brownsmithdynamics.com/guides/mvp-building/foundations/prototype-mvp-and-production-product)
- MVP = one complete valuable workflow for real users testing a falsifiable assumption; exclude breadth (analytics suites, multi-providers) not integrity of the core path. — same source; [Baaz: Scope an MVP](https://baaz.pro/blog/how-to-scope-mvp-that-ships)
- Completeness vs integrity: Version 1 can omit features but should not omit authorization, data protection, payment correctness, error handling, instrumentation, applicable compliance. — [Intersog: Scope an MVP](https://intersog.co.il/blog/how-to-scope-an-mvp-without-building-your-whole-product-roadmap/)
- MVP PRD guidance: 3–8 pages; non-goals longer than goals; sections: overview, problem, goals/non-goals, users/roles, stories+AC, high-level data model, technical constraints/shortcuts, success metrics, release window. — [MVP Requirements Document](https://mvpdevelopment.company/blog/mvp-requirements-document)
- Anthropic Labs anecdote: for unknown “what,” skip PRD and use multi-option prototypes as the alignment artifact. — [Howardism](https://www.howardism.dev/articles/prototype-over-prd)
- AI products: even early, define eval thresholds, fallbacks, behavioral never-dos before calling something “done.” — [Adaline Labs](https://labs.adaline.ai/p/ai-prd-missing-sections); [vittobh AI PRD templates](https://github.com/vittobh/prd-templates/blob/main/README.md)

**Essential checklist by stage:**

| | Prototype | Production / MVP |
|---|---|---|
| Problem & learning goal | Required | Required |
| Audience | Required | Required (narrow) |
| Success of *learning* | Required | → Success of *outcome* metrics |
| Happy-path UX / scenarios | Required | Required end-to-end |
| Non-goals | Helpful | Critical |
| AuthZ / data isolation | Optional (fake) | Required if real users/data |
| Error/failure for money/data | Optional | Required |
| Observability / rollback | Optional | Required |
| NFRs (perf, security, DR) | Skip | Scale to risk |
| Full GTM / support ops | Skip | As needed for real users |
| AI evals / HITL / bounds | If AI demo claims quality | Required to ship AI |

### Inferences
- Spec length should track **what can go wrong for real users**, not feature count.
- For AI-assisted build workflows, PRPs add validation commands/context that traditional prototype PRDs omit. — [Wirasm PRP](https://github.com/Wirasm/PRPs-agentic-eng)

### Gaps
- Limited official “prototype PRD” templates from FAANG; practice inferred from SVPG + MVP literature + AI-lab anecdotes.
- Border between “prototype in production clothing” and MVP remains org-specific.

---

## Any 2024–2026 shifts (living docs, AI-assisted PRDs, shorter specs)? What is outdated vs current best practice?

### Takeaway
**2024–2026 shift:** away from long static approval contracts toward short living docs, stage checklists, prototypes-as-spec (esp. AI labs), and AI-drafted PRDs—while **AI products ironically need more precise behavioral/eval sections** than classic feature PRDs.

### Cited Findings

**Shorter / living**
- “PRD is dead” as monolithic contract (Aug 2025): replace with one-pagers + living docs; kill multi-level approval chains; match format to context. — [Product Consortium](https://www.theproductconsortium.com/articles/product-101-prd-is-dead)
- Living PRD mechanics: section versioning, inline threads, PR-style diffs; gates for problem/scope/success/deps/risk/design. — [Prodinja living PRD](https://www.pmsynapse.in/blog/living-prd-workflow-single-spec-home)
- Checklist-by-lifecycle over fill-once templates. — [Mind the Product](https://www.mindtheproduct.com/ditch-the-prd-template-and-embrace-the-prd-checklist/)
- Linear public practice (2024): minimal 3-section living PRD. — [Nan Yu](https://www.linkedin.com/posts/thenanyu_linear-example-prd-priority-micro-adjust-activity-7264312237106860033-ndt5)
- Amplitude: 1-page / ~3-minute read norm. — [Amplitude](https://amplitude.com/blog/product-docs)

**AI-assisted authoring**
- Custom GPT / Claude workflows for markdown PRDs (2024–2025); emphasize enterprise AI (don’t paste secrets into consumer chat). — [dataprodmgmt](https://dataprodmgmt.substack.com/p/how-i-use-chatgpt-to-generate-markdown); [Kyle Libra](https://kylelibra.substack.com/p/how-to-write-prds-using-ai)
- Comparative tests favoring Claude for strategic depth / mocks; ChatPRD as structured alternative. — [Fireside PM](https://firesidepm.substack.com/p/i-tested-5-ai-tools-to-write-a-prdheres); [prompttoproduct](https://prompttoproduct.substack.com/p/writing-prds-in-the-age-of-ai-i-tested)
- “48-hour PRD” claims with LLM structuring research/drafts while PM owns judgment (Aug 2025). — [tapankamdar](https://tapankamdar.substack.com/p/from-4-weeks-to-48-hours-the-ai-prd)
- Hustle Badger (updated 2025/2026 page): Claude Code PRD reviewer agent as part of modern toolkit. — [Hustle Badger](https://www.hustlebadger.com/what-do-product-teams-do/prd-template-examples/)
- Agentic engineering: PRD evolves into **PRP** with codebase intelligence + executable validation. — [Wirasm PRP](https://github.com/Wirasm/PRPs-agentic-eng)

**Prototype-first / AI product cadence**
- Spec after prototype behavior is visible (1–2 weeks vs 8–12 weeks old flow)—claimed industry shift for AI features. — [Adaline Labs](https://labs.adaline.ai/p/ai-prd-missing-sections)
- Anthropic Labs: prototype over PRD. — [Howardism](https://www.howardism.dev/articles/prototype-over-prd)

**Outdated vs current (explicit contrast)**

| Outdated (still seen) | Current best practice |
|---|---|
| 20–40 page static PRD as contract before learning | 1-pager / lean living doc; detail emerges with discovery |
| Spec every screen/edge case upfront | Problem + metrics + non-goals; edge cases at solution-review gate |
| Multi-level sign-off before eng starts | Lightweight alignment; update as you learn |
| Feature laundry lists as “requirements” | Outcomes, scenarios, prioritized must-haves |
| User stories that smuggle solutions too early | Job stories / problem statements first; stories later |
| PRD never updated after kickoff | Changelog / milestones as living section |
| One mega-template for every initiative | Match format to size/risk (paragraph ↔ one-pager ↔ PR/FAQ ↔ AI PRD) |
| Ignoring AI-specific quality | Evals, fallbacks, behavioral constraints, HITL |
| Zero documentation (“we move fast”) | Short docs that get read and commented |

Foundational older sources still cited as useful: Lenny 2019 problem framework; Amazon Working Backwards (book/process since ~2004, still taught); Intercom job stories (~2013); Shape Up pitches (Basecamp) as PRD alternative—referenced by Product Consortium (2025).

### Inferences
- The industry is bifurcating: **shorter human alignment docs** + **richer machine-consumable specs** (PRPs, eval plans) for AI builders.
- “PRD is dead” rhetoric means *waterfall PRD*, not *written product thinking*.

### Gaps
- Few rigorous 2026 academic or large-n surveys of PRD practices; evidence is practitioner blogs, templates, and company anecdotes.
- Conflicting advice (OpenAI-style long AI PRD vs Anthropic prototype-over-PRD) is real—choose by team scale, risk, and whether behavior must be contractually aligned across many teams.

---

## Meta: formats & length cheat-sheet (for report synthesis)

### Takeaway
Pick format by decision stage and blast radius; default modern length is **one page**, expand only for go/no-go narratives, regulated/AI behavior, or multi-team delivery.

### Cited Findings
- **Paragraph / issue description** — small features (Product Consortium). — [link](https://www.theproductconsortium.com/articles/product-101-prd-is-dead)
- **1-pager / product brief** — most initiatives; Amplitude, Lenny, Productboard brief (1–2 pp). — [Amplitude](https://amplitude.com/blog/product-docs); [Productboard](https://www.productboard.com/glossary/product-brief/)
- **Linear 3-section PRD** — feature delivery with living milestones. — [Nan Yu](https://www.linkedin.com/posts/thenanyu_linear-example-prd-priority-micro-adjust-activity-7264312237106860033-ndt5)
- **Amazon PR/FAQ** — ≤1p PR + ≤~5p FAQ for major bets. — [About Amazon](https://www.aboutamazon.com/news/workplace/an-insider-look-at-amazons-culture-and-processes)
- **Full PRD / AI PRD** — cross-functional, GTM, AI constraints; still “living.” — [Miqdad Jaffer](https://www.productcompass.pm/p/ai-prd-template); [Atlassian](https://www.atlassian.com/software/confluence/templates/product-requirements)
- **MVP PRD** — often 3–8 pages if others build for you. — [MVP requirements](https://mvpdevelopment.company/blog/mvp-requirements-document)
- **Prototype-as-spec** — interactive artifact replaces long prose. — [Howardism](https://www.howardism.dev/articles/prototype-over-prd)
- **Tools**: Notion / Confluence / Linear / Google Docs / Coda (Figma template) / Productboard boards; AI: ChatPRD, Claude Projects, Custom GPTs, Cursor/Claude Code reviewers.

### Inferences
- Hosting tool matters less than **update culture** (comments, sync, version history).

### Gaps
- No reliable published “median PRD word count 2025” statistic found.
