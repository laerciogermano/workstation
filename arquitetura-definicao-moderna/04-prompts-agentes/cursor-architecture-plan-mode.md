Skip to content

Level up in Cursor

- 400+ guides, Level 1 to 5
- The Setup Pack for your stack
- $59.99 once, 12 months

Buy the Toolkit Already have an account? Sign in

Improve this page

# Designing system architecture with Cursor's agent

PL

Level 4 How-to Updated 2026-10-12

Architecture design with Cursor’s agent is a four-part loop: Plan Mode researches the codebase and compares options before any code is written, a human records the decision as an Architecture Decision Record (ADR), a project rule tells the agent the decision, and CI fitness checks prove every later change still obeys it.

Your SaaS product has just signed its first enterprise customer. The contract asks for tenant data isolation, SSO, role-based access and an audit log, and your current system is one Next.js app on one PostgreSQL database with a `users` table and no idea of a tenant. The multi-tenancy choice you make this month shapes every query, migration and incident for years, and after the decision the agent will write most of the code that implements it. This page is for the developer or tech lead who owns that decision and does not want to review 50 migrations line by line to know it was carried out.

Covers the Cursor 3.x line; the current release on 2026-10-12 is Cursor 3.24 (2026-10-09, Cursor’s release notes). Cursor’s docs list four agent modes, Agent, Ask, Plan and Debug, and Shift+Tab cycles through them; Cmd+I (Ctrl+I on Windows and Linux) opens the Agent panel. Its run modes are Auto-review, Allowlist and Run Everything, and Cursor names no single default model (all checked 2026-10-12). Plan Mode, Rules and Hooks were first verified against cursor.com on 28 August 2026. dependency-cruiser 18.4.0 was checked with `npm view` and Postgres MCP Pro 0.3.0 on PyPI on 26 September 2026.

## What an architecture session in Cursor leaves behind

Section titled “What an architecture session in Cursor leaves behind”

- A constraints file the agent reads first, so its proposals fit your team and budget rather than an imaginary one.
- Four copy-paste prompts: research, option comparison, ADR, and a phased plan in which every phase ships and proves itself.
- An ADR with a “How we verify this holds” section, signed off by a named person.
- A project rule that states the decision, plus the machine checks that enforce it: a dependency rule, two SQL checks on the schema and a tenant-isolation test.
- Recovery steps for the six ways this loop usually fails.

The tool-neutral method behind this page, short ADRs plus machine-checkable constraints, is on architecture decisions agents can follow. Schema-level design, such as keys, indexes and normalisation, belongs to database design in Cursor. This page is the Cursor procedure for one system-level decision from question to enforcement.

## How do you run an architecture decision through Cursor?

Section titled “How do you run an architecture decision through Cursor?”

The order matters more than any single prompt. Decide before the agent builds, and build the checks before the agent writes the bulk of the code.

1. Write the constraints down in `docs/architecture/constraints.md`: team size, budget, compliance duties, SLOs and anything already decided. The agent cannot infer that you have three engineers and no on-call rota.
2. Research in Plan Mode. Plan Mode “creates detailed implementation plans before writing any code” (cursor.com/docs/agent/plan-mode, verified 28 August 2026), so the agent researches and asks questions before it writes any code.
3. Compare the options on the dimensions your constraints name, with evidence from the codebase for every claim.
4. Decide and record it. A human picks the option. The agent drafts the ADR and you edit it until it says what you mean.
5. Encode and enforce. Write the project rule and the fitness checks, and run the checks in CI before the implementation starts.
6. Plan the implementation in phases that each deploy on their own and each end with named evidence.

Start each step in a new chat. A fresh context is not anchored on the reasoning of the previous step, and the files on disk carry the state forward.

## Step 1: Give the agent your real constraints

Section titled “Step 1: Give the agent your real constraints”

A proposal is only as good as the constraints it was optimised for. Without them the agent tends to recommend what suits a large platform team: a database per tenant, a service mesh, an event bus. Write a short file and reference it in every architecture prompt:

docs/architecture/constraints.md

```markdown
# Architecture constraints (owner: Anna Kowalska, reviewed 2026-09-26)- Team: 3 backend engineers, no dedicated ops; on-call is best effort.- Stack: Next.js App Router, PostgreSQL 17 on a managed service, Drizzle ORM.- Scale today: ~500 users in 20 organisations; target 1,000 tenants in 18 months.- Contract duties: tenant data isolation, SAML 2.0 and OIDC SSO, audit log of all writes, 99.9% monthly uptime.- Budget: one additional managed database at most; no Kubernetes.- Already decided: stay on PostgreSQL; no rewrite of the Next.js app.

```

## Step 2: Research the system in Plan Mode

Section titled “Step 2: Research the system in Plan Mode”

Switch the agent to Plan Mode and paste the research prompt. The goal of this step is questions, not an answer: the agent should find what you have not told it.

Copy-paste prompt: architecture research in Plan Mode

```text
@docs/architecture/constraints.md @src @drizzleWe must add enterprise multi-tenancy: tenant data isolation, SSO (SAML 2.0 and OIDC),role-based access inside each tenant and an audit log of every write.Do not propose a solution yet and do not edit any file.1. Map the current system: every table, where each table is queried from (file paths),   how requests are authenticated and where the session is read.2. List every place that assumes a single tenant (global queries, unique constraints   on email, caches keyed without an organisation, background jobs, exports).3. Ask me up to eight questions whose answers would change the architecture,   most decision-shaping first.4. List the decisions I must make, in the order they constrain each other.Cite a file path for every claim about the code. If you could not find something,say so instead of assuming it.

```

Migration files describe the schema you meant to have. If the agent should also see the one you really have, including constraints and any policies added by hand, connect a read-only database MCP server to a staging copy. Postgres MCP Pro (PyPI `postgres-mcp`, run with `uvx postgres-mcp --access-mode=restricted`) limits the agent to read-only transactions. Give it a role that can read the catalog and nothing else, and keep the connection string in your global Cursor MCP configuration, not in the repository. Setup for all three tools is on database MCP servers.

Answer the questions in the chat, then save the inventory and your answers to `docs/architecture/multi-tenancy-research.md`. Spot-check three of the cited file paths yourself. If one is wrong, the inventory is unreliable, and you should re-run the prompt with a narrower `@` scope before you go on.

## Step 3: Compare the options with evidence, not adjectives

Section titled “Step 3: Compare the options with evidence, not adjectives”

“Row-level security is simpler” is an opinion. “Row-level security changes 38 files, and here they are” is a claim you can check. Ask for the second kind.

Copy-paste prompt: compare multi-tenancy options

```text
@docs/architecture/constraints.md @docs/architecture/multi-tenancy-research.md @drizzleCompare three multi-tenancy options for this codebase:A. Shared tables with a tenant_id column and PostgreSQL row-level security (RLS).B. One PostgreSQL schema per tenant.C. One database per tenant.Return one markdown table with a row per option and these columns:files that must change (count, plus the list in an appendix), migration steps,effect on every query, backup and restore per tenant, connection pooling,isolation strength against the contract wording, operating cost at 100 and at1,000 tenants, and the first thing that breaks for a team of three.Then, for each option, name one automated check that would prove its isolationholds (a test, a query or a CI rule), and the failure that check would catch.Do not recommend an option. Mark every estimate as an estimate.

```

Read the table against your constraints, not against the agent’s tone. A useful habit is to fill a small decision table yourself before you read the agent’s recommendation, if you asked for one:

| Criterion (from constraints.md) | Weight | A: RLS | B: schema per tenant | C: database per tenant |
| --- | --- | --- | --- | --- |
| Isolation meets the contract wording | Must | | | |
| Operable by 3 engineers, no ops | Must | | | |
| Migration effort | 3 | | | |
| Per-tenant restore | 2 | | | |
| Cost at 1,000 tenants | 2 | | | |

Run the same prompt for the next decision (SSO: build on a library or buy a provider; what happens to existing password users when their organisation turns SSO on). One decision per chat keeps each comparison focused.

## Step 4: Record the decision as an ADR a human signs

Section titled “Step 4: Record the decision as an ADR a human signs”

The agent drafts; a named person decides. The ADR is short, and its most important section is the one most templates leave out: how the team will know the decision still holds.

Switch back to Agent mode for this step; it writes one file.

Copy-paste prompt: draft the ADR

```text
@docs/architecture/constraints.md @docs/architecture/multi-tenancy-research.mdDraft docs/adr/0003-multi-tenancy.md with status "Proposed". I chose option A:shared tables with tenant_id and PostgreSQL row-level security, the applicationconnecting as a role that is not the table owner and has no BYPASSRLS.Sections, at most one page in total:- Context: the contract duties and constraints that drove the choice.- Decision: what we do, in rules a reviewer can check ("every tenant-owned table  has tenant_id NOT NULL and RLS enabled and forced").- Options rejected and the one-line reason for each.- Consequences: what gets harder, including the risk of a missing policy leaking data.- How we verify this holds: the automated checks, where they run, and what fails  when the decision is violated.- Allowed exceptions: the global tables that have no tenant_id, listed by name.Write nothing else and change no other file.

```

Edit the draft until every line is true, then change the status to “Accepted” in a pull request that the decision owner approves. From then on, the ADR changes only through another pull request; protecting the oracle shows how to keep an agent from editing files like this one.

## Step 5: Stop the agent eroding the decision

Section titled “Step 5: Stop the agent eroding the decision”

Two layers, and only the second one is a guarantee. A project rule is an instruction the agent reads; a check is something the agent cannot argue with.

### Tell the agent: a project rule

Section titled “Tell the agent: a project rule”

Create an architecture rule that applies to every session. File placement, scopes and how to confirm a rule is active are on project rules in Cursor. Keep the body short and point to the ADRs rather than restating them:

```markdown
# Architecture (source of truth: docs/adr/)- Multi-tenancy (ADR-0003): every tenant-owned table has tenant_id NOT NULL with RLS  enabled and forced. New tables need a policy in the same migration. Global tables  are listed in the ADR; do not add one without a new ADR.- Data access: route handlers in src/app/api/ call functions in src/repositories/;  they never import src/db/ directly.- Every write goes through a repository function that also writes an audit_log row.- Before you finish, run `npm run fitness` and `npm test`, and report their output.- If a task seems to need a change to these rules, stop and say so. Do not work around them.

```

### Prove it: fitness checks in CI

Section titled “Prove it: fitness checks in CI”

Write the checks now, while the codebase is small and the decision is fresh, and have them fail on the current code where it does not yet comply. Three checks cover this ADR.

Layering, with dependency-cruiser. One rule from the full set on fitness functions:

```js
// .dependency-cruiser.cjs (one rule of the full set)module.exports = {  forbidden: [    {      name: 'handlers-use-repositories',      severity: 'error',      comment: 'ADR-0003: route handlers call src/repositories/, never src/db/ directly.',      from: { path: '^src/app/api/' },      to: { path: '^src/db/' },    },  ],};

```

Pin `typescript@~6.0` as a dev dependency for the analysis. dependency-cruiser 18.4.0 supports only TypeScript below 7.0.0; with TypeScript 7 installed it cruises zero modules and still exits 0. The fitness-functions page has a canary job that fails the build when the check goes blind.

Schema invariants, as SQL that must return zero rows. Save both queries as `checks/schema-invariants.sql` and run them against a database migrated from scratch in CI:

```sql
-- Tenant-owned tables without RLS enabled and forcedSELECT c.relnameFROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespaceWHERE n.nspname = 'public' AND c.relkind = 'r'  AND c.relname NOT IN ('plans', 'feature_flags', 'schema_migrations')  -- ADR-0003 exceptions  AND NOT (c.relrowsecurity AND c.relforcerowsecurity);-- Tenant-owned tables without a tenant_id columnSELECT t.table_nameFROM information_schema.tables tWHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'  AND t.table_name NOT IN ('plans', 'feature_flags', 'schema_migrations')  AND NOT EXISTS (    SELECT 1 FROM information_schema.columns c    WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name      AND c.column_name = 'tenant_id');

```

Behaviour: a tenant-isolation test. The SQL checks prove the policies exist; this test proves they work. Each tenant-owned table gets a policy that compares `tenant_id` with a per-connection setting. With the second argument `true`, a connection that never set a tenant sees no rows instead of getting an error:

```sql
-- In the migration that creates each tenant-owned table (orders shown)ALTER TABLE orders ENABLE ROW LEVEL SECURITY;ALTER TABLE orders FORCE ROW LEVEL SECURITY;CREATE POLICY tenant_isolation ON orders  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

```

The test seeds two tenants, connects as `app_user` with tenant A’s context and asks each tenant-owned table for tenant B’s rows. It also asserts the role and that tenant A sees its own data, so a misconfigured connection or an empty seed cannot turn it green:

tests/tenant-isolation.test.ts

```ts
import { Client } from 'pg';import { afterAll, beforeAll, expect, it } from 'vitest';const TENANT_OWNED = ['orders', 'invoices', 'audit_log']; // every table outside the ADR exceptionsconst A = process.env.TENANT_A_ID!; // both tenants seeded before the runconst B = process.env.TENANT_B_ID!;const db = new Client({ connectionString: process.env.APP_DATABASE_URL }); // logs in as app_userbeforeAll(async () => {  await db.connect();  await db.query("SELECT set_config('app.tenant_id', $1, false)", [A]);});afterAll(() => db.end());it('runs as the application role, not the owner', async () => {  const { rows } = await db.query('SELECT current_user');  expect(rows[0].current_user).toBe('app_user');});it('sees its own rows, so the check is not vacuous', async () => {  const { rows } = await db.query('SELECT count(*)::int AS n FROM orders');  expect(rows[0].n).toBeGreaterThan(0);});it.each(TENANT_OWNED)('%s returns no rows of tenant B', async (table) => {  const { rows } = await db.query(`SELECT count(*)::int AS n FROM ${table} WHERE tenant_id = $1`, [B]);  expect(rows[0].n).toBe(0);});

```

RLS that passes every test and protects nothing

PostgreSQL does not apply row-level security to superusers or to roles with `BYPASSRLS`, and it does not apply it to a table’s owner unless the table has `FORCE ROW LEVEL SECURITY`. If your tests connect as the migration user, the isolation test passes while production leaks. Run the isolation test as the same role the application uses.

One command for the agent and CI. The project rule and the hook below both call `npm run fitness`, which runs the layering rule and the schema queries. `psql` exits 0 when a query returns rows, so the script writes the rows to a file and fails if that file is not empty:

```json
{  "scripts": {    "fitness": "depcruise src --config .dependency-cruiser.cjs && psql \"$DATABASE_URL\" -tAq -v ON_ERROR_STOP=1 -f checks/schema-invariants.sql -o .fitness-violations.txt && test ! -s .fitness-violations.txt"  }}

```

The isolation test runs under `npm test`, which the rule also asks for.

Cursor’s hooks run “before or after defined stages of the agent loop and can observe, block, or modify behavior” (cursor.com/docs/hooks, verified 28 August 2026), so you can also run `npm run fitness` when the agent finishes. Treat that as fast feedback for the agent. CI is the gate, because it runs whether or not a hook is installed.

## Step 6: Turn the ADR into phases that each prove themselves

Section titled “Step 6: Turn the ADR into phases that each prove themselves”

A big plan fails in the middle, where nothing works and nothing is verified. Ask for phases that each deploy on their own and each end with evidence you can check without reading the diff.

Switch back to Agent mode for this step; it writes one file.

Copy-paste prompt: phased implementation plan

```text
@docs/adr/0003-multi-tenancy.md @docs/architecture/multi-tenancy-research.md @drizzleCreate docs/plans/multi-tenancy.md: an implementation plan for ADR-0003.Rules for the plan:- Each phase deploys to production on its own and leaves the system working.- Each phase is at most about one week for one engineer.- The first phase adds the fitness checks from the ADR and makes them pass on the  existing code with an explicit list of known violations.- For each phase give: the files that change, the migration (if any) and its  rollback, the acceptance evidence (which tests, checks or metrics must be green  and what they show), and what the reviewer should look at by hand (at most three  items).- Put the riskiest phase (enabling RLS on existing tables) behind a feature flag  or a shadow mode that logs cross-tenant reads before it blocks them.Do not write code. List open questions at the end.

```

Approve the plan, then run each phase as its own agent task in a new chat that references the plan and the ADR. Checkpoints and branching covers how to back out of a phase that goes wrong locally.

## How do you verify the architecture without reading every diff?

Section titled “How do you verify the architecture without reading every diff?”

You read the decision and the checks closely once. After that, each pull request is judged on evidence:

| What you need to know | Evidence | Who signs off |
| --- | --- | --- |
| Is the decision the right one? | ADR with options, consequences and verification section | Decision owner, once |
| Does the code still follow the layering? | dependency-cruiser in CI, zero new violations | CI |
| Does every table have isolation in place? | The two SQL checks return zero rows | CI |
| Does isolation actually hold? | Tenant-isolation test as the application role | CI |
| Did a phase meet its acceptance criteria? | The evidence listed for that phase in the plan | Reviewer, against the plan |
| Did anything slip past the checks? | Bugbot or another review agent as an extra reviewer, not a gate | Reviewer reads its findings |

Human review then concentrates on migrations, new policies and changes to the exception list, which is where a wrong line leaks data. How to set up Bugbot and route reviews is on code review in Cursor.

## What breaks when you design architecture with Cursor’s agent?

Section titled “What breaks when you design architecture with Cursor’s agent?”

The proposal fits a company ten times your size. Symptom: a database per tenant, a message bus and a new service for audit logging, for a team of three. Recovery: check that `constraints.md` was in the prompt, add “the first thing that breaks for a team of three” as a comparison column, and ask the agent to remove every component your constraints do not require.

The comparison is confident and wrong about your code. Symptom: a cited file does not exist, or the change count is far off. Recovery: spot-check three citations; if one fails, discard the table, narrow the `@` scope to the directories that matter, and re-run the comparison prompt in a new chat.

The agent ignores the architecture rule. Symptom: a new route handler imports `src/db/` directly. The rule was probably not in context: check the active rules list as described on project rules in Cursor. The dependency-cruiser check fails the build either way; paste its output into the chat and ask for a fix that keeps the rule.

The agent edits the check instead of the code. Symptom: an entry added to the SQL exception list, a rule’s `severity` lowered to `warn`, or a new entry in the known-violations baseline. Recovery: revert those files, restart the task, and add the fitness config and the ADR to the paths that need an owner’s approval, as protecting the oracle shows.

The ADR goes stale. Symptom: the rule says RLS, and a later migration moved one domain to a separate database. A stale rule is worse than none because it pushes the agent toward the old design. Recovery: supersede the ADR with a new one in the same pull request as the change, and update the rule and the checks together.

Phase three of five is half-done and nothing works. The plan was written as layers (all migrations, then all queries) instead of deployable slices. Recovery: stop, re-run the plan prompt with the phase rules above, and cut the remaining work so that each phase ends green in CI and in production.

## Where to go next with architecture in Cursor

Section titled “Where to go next with architecture in Cursor”

Architecture decisions agents can follow The tool-neutral method: short ADRs plus machine-checkable constraints.

Fitness functions Complete dependency, complexity, duplication and API-surface checks for three stacks.

Database design in Cursor Design the schema behind the decision: keys, indexes and constraints.

Microservices with Cursor Apply the same loop when the decision is about service boundaries.

Migration with Cursor Move an existing system to the new architecture in safe steps.

Architecture in Claude Code The same decision from the terminal, with hooks and headless runs.

## Did this guide help you?

One tap, no sign-in.

0 1 2 3 4 5

not at all a lot

Change

What will you do with it?

Apply it now Maybe later Nothing, not for me

How did it read?

Too basic Just right Too hard

What got in the way? Pick any that apply

Out of date No example Too long A wrong command or code Not what I was looking for Nothing

Your role?

Developer Lead or architect CTO or manager

What should change?

Send

Thanks. I read every answer. Michał Jaskólski

Did this guide help?

0 1 2 3 4 5

One tap each. Close whenever you like.

no sign-in

## Related pages

- Cursor quick start: from install to a verified first feature The Cursor quick start: install, a verify command, run modes, project rules, MCP and Plan Mode, then a first feature proved by tests, not by reading the diff.
- Build your first AI-assisted feature Build a multi-file feature with Cursor's agent: acceptance criteria, Plan Mode, scoped build steps, and proof it works without reading every line.
- Cursor IDE: The AI Code Editor Start here for Cursor: which surface fits which task, how a change moves from plan to merged pull request, and how to prove it works without reading every diff.

Books · in the Toolkit Books · in your Toolkit 08 titles · EN + PL Included

## Read Cursor as a book. Take Cursor offline.

This section, bound into one book you can read start to finish, with a contents list you can click.

This section, bound into one book you can read start to finish, with a contents list you can click. It is in your Toolkit, and the file you download stays yours.

- 72 Chapters
- 767 Pages
- EPUB·PDF Formats

See all eight books One of eight books in the Toolkit · $59.99 once

Download the book Browse all eight

Also on amazon.com: Kindle on amazon.com, opens in a new tab · Paperback on amazon.com, opens in a new tab

This section 

HANDBOOK

CLAUDE CODE

CODEX

DEVELOPERS

TECH LEADS

CTOS

EXECUTIVES

Spines follow page count · 1,523 → 184

All eight are yours · EN + PL

All 577 guides Free resources: Compare tools · Glossary · By role

Written by Michał Jaskólski

See what's new on the platform.

Privacy Policy · Terms of Service · Cookie settings · llms.txt · pricing.md · RSS

GitHub X Discord

```json
{"@context":"https://schema.org","@type":"Organization","@id":"https://developertoolkit.ai/#organization","name":"AI Developer Toolkit","alternateName":["Wondel.ai AI Developer Toolkit","Developer Toolkit"],"legalName":"Wondel.ai spółka z ograniczoną odpowiedzialnością","url":"https://developertoolkit.ai/","logo":{"@type":"ImageObject","url":"https://developertoolkit.ai/logos/favicon-512x512.png","width":512,"height":512},"description":"Publisher of AI Developer Toolkit: documentation for agentic engineering with Cursor, Claude Code and Codex.","foundingDate":"2024","founder":{"@id":"https://developertoolkit.ai/#michal-jaskolski"},"email":"support@developertoolkit.ai","areaServed":"Worldwide","publishingPrinciples":"https://developertoolkit.ai/en/about/","knowsAbout":["Agentic engineering","Claude Code","OpenAI Codex","Cursor IDE","Model Context Protocol","AI coding agents","Software factories"],"brand":{"@type":"Brand","name":"AI Developer Toolkit","url":"https://developertoolkit.ai/"},"address":{"@type":"PostalAddress","streetAddress":"Twarda 18","addressLocality":"Warsaw","postalCode":"00-105","addressRegion":"Mazowieckie","addressCountry":"PL"},"sameAs":["https://x.com/devtoolkit_AI","https://github.com/wondelai","https://discord.gg/czS5bSapg9","https://wondel.ai"],"contactPoint":{"@type":"ContactPoint","contactType":"customer service","email":"support@developertoolkit.ai","availableLanguage":["English","Polish"],"areaServed":"Worldwide"}}
{"@context":"https://schema.org","@type":"Person","@id":"https://developertoolkit.ai/#michal-jaskolski","name":"Michał Jaskólski","alternateName":"Michal Jaskolski","url":"https://developertoolkit.ai/en/about/","image":"https://developertoolkit.ai/images/michal-jaskolski.jpg","jobTitle":"CTO","description":"26 years building web apps, 2 IPOs, AI Lecturer at SWPS University, CTO at TasteRay. Author of AI Developer Toolkit, and answers for every guide on it.","knowsAbout":["Cursor","Claude Code","OpenAI Codex","AI-assisted software development","Software architecture","Agentic engineering","Software factories","Autonomous coding agents","Model Context Protocol"],"worksFor":{"@type":"Organization","@id":"https://developertoolkit.ai/#tasteray","name":"TasteRay","url":"https://www.tasteray.com/"},"affiliation":{"@type":"EducationalOrganization","name":"SWPS University"},"sameAs":["https://www.linkedin.com/in/mjaskolski/","https://x.com/jaskol_ski","https://github.com/mjaskolski","https://www.facebook.com/michal.jaskolski"]}
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Guides","item":"https://developertoolkit.ai/en/contents/"},{"@type":"ListItem","position":2,"name":"Cursor","item":"https://developertoolkit.ai/en/cursor-ide/"},{"@type":"ListItem","position":3,"name":"Plan","item":"https://developertoolkit.ai/en/cursor-ide/plan/"}]}
{"@context":"https://schema.org","@type":"TechArticle","headline":"Designing system architecture with Cursor's agent","name":"Designing system architecture with Cursor's agent","description":"Research options in Cursor's Plan Mode, record the decision as an ADR, then enforce it with a project rule and CI fitness checks instead of reading every diff.","url":"https://developertoolkit.ai/en/cursor-ide/plan/architecture/","datePublished":"2025-07-24T00:00:00.000Z","dateModified":"2026-10-12T00:00:00.000Z","author":{"@id":"https://developertoolkit.ai/#michal-jaskolski"},"publisher":{"@id":"https://developertoolkit.ai/#organization"},"mainEntityOfPage":{"@type":"WebPage","@id":"https://developertoolkit.ai/en/cursor-ide/plan/architecture/"},"inLanguage":"en","image":"https://developertoolkit.ai/og/en/cursor-ide/plan/architecture.png","isAccessibleForFree":false,"hasPart":{"@type":"WebPageElement","isAccessibleForFree":false,"cssSelector":".sl-markdown-content"},"speakable":{"@type":"SpeakableSpecification","cssSelector":["h1",".sl-markdown-content h2",".sl-markdown-content p"]},"about":{"@type":"SoftwareApplication","name":"Cursor","applicationCategory":"DeveloperApplication","operatingSystem":"Windows, macOS, Linux","url":"https://cursor.com","description":"AI-powered IDE with agent mode, inline edits, and frontier-model integration"}}

```