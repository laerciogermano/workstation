# IA-readable docs, Spec-Driven Development, AGENTS.md e segurança para agentes

## What is AGENTS.md open standard and recommended structure?

### Takeaway
AGENTS.md is a vendor-neutral Markdown convention (README-for-agents) released by OpenAI in August 2025 and donated to the Linux Foundation Agentic AI Foundation (AAIF); there are no required fields—keep a lean root file with build/test/security/conventions, nest per package in monorepos, and treat closest file + user chat as precedence.

### Cited Findings
- Official site defines AGENTS.md as “a README for agents”: a predictable place for agent context (build steps, tests, conventions) kept separate from human README.md — [agents.md](https://agents.md/)
- Recommended popular sections: project overview; build and test commands; code style; testing instructions; security considerations; plus commit/PR guidelines, security gotchas, large datasets, deployment as needed — [agents.md](https://agents.md/)
- No required fields: “just standard Markdown”; conflict resolution: closest AGENTS.md to the edited file wins; explicit user chat prompts override everything; listed test commands are expected to be run by the agent — [agents.md](https://agents.md/)
- Monorepos: nested AGENTS.md per package; nearest file takes precedence; OpenAI’s main repo cited with 88 AGENTS.md files — [agents.md](https://agents.md/)
- Released August 2025; OpenAI reports adoption by 60k+ OSS projects and agents including Amp, Codex, Cursor, Devin, Factory, Gemini CLI, GitHub Copilot, Jules, VS Code — [OpenAI AAIF post](https://openai.com/index/agentic-ai-foundation/); [Linux Foundation AAIF announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) (9 Dec 2025)
- Stewardship: donated to AAIF under Linux Foundation alongside Anthropic MCP and Block goose — [OpenAI AAIF post](https://openai.com/index/agentic-ai-foundation/); [AAIF project page](https://aaif.io/projects/agents-md)
- Claude Code: target under ~200 lines per CLAUDE.md; longer files consume more context and reduce adherence; concrete/verifiable instructions beat vague ones; path-scoped rules for local procedures; imports do not reduce context cost — [Claude Code memory docs](https://code.claude.com/docs/en/memory)
- Claude Code reads AGENTS.md when no CLAUDE.md/CLAUDE.local.md is present; if both exist, CLAUDE.md wins unless it imports AGENTS.md — [Claude Code memory docs](https://code.claude.com/docs/en/memory)
- Practitioner guidance: ship AGENTS.md as canonical; symlink CLAUDE.md → AGENTS.md to avoid drift; include exact build/test/run, conventions, layout, out-of-scope/ask-first; prune ruthlessly — [Agentic Developer Cookbook](https://agenticdevelopercookbook.com/guidelines/planning/code-quality/agent-instruction-files)
- Anthropic CLAUDE.md article: keep concise; do not put secrets/API keys/credentials/DB URLs in committed instruction files — [Using CLAUDE.md files](https://claude.com/resources/articles/using-claude-md-files)
- Codex-related practice note: some ecosystems mention a ~32 KiB project-doc cap (`project_doc_max_bytes`) as a tooling limit — [reopt handbook / project rules](https://handbook.reopt.ai/en/books/agentic-documentation/project-rules) (secondary; not AAIF-normative)

### Inferences
- Recommended structure for agents: (1) always-on AGENTS.md ≤ ~150–200 lines with commands + hard rules + pointers; (2) nested AGENTS.md for package deltas only; (3) deep specs (PRD/ADR/OpenAPI/Gherkin) linked, not inlined; (4) optional thin CLAUDE.md that `@AGENTS.md` or symlinks.
- Size discipline is the main reliability lever: bloated/stale instruction files degrade adherence (practitioner consensus; Anthropic’s 200-line target is the clearest vendor guidance found).

### Gaps
- AAIF has not published a rigid schema/schema.org-style required section set beyond “Markdown with any headings”—structure guidance is conventional, not normative.
- The “60k projects” figure is vendor/LF-reported; independent audit not found.
- Exact Cursor-specific AGENTS.md loading rules beyond “ecosystem support” on agents.md were not verified in primary Cursor docs in this pass.

---

## Spec-driven development workflow with Cursor/Claude?

### Takeaway
Modern SDD for Cursor/Claude is a gated pipeline—specify → plan → tasks → implement—with human approval between phases; GitHub’s spec-kit installs the same slash commands into `.cursor/commands/` and `.claude/commands/`, using `.specify/` (constitution + templates) as shared institutional memory.

### Cited Findings
- Spec-kit (GitHub): SDD framework where specs are source of truth and code is output; provides `.specify/`, constitution, templates, slash commands for Claude Code and Cursor — [Spec-Kit article (Mar 2026)](https://sriaradhyula.github.io/posts/spec-kit-scaffolding-with-ai-coding-assistants/); repo [github/spec-kit](https://github.com/github/spec-kit)
- Core commands: `/speckit.specify` → spec.md; `/speckit.plan` → plan.md (+ research/data-model/API); `/speckit.tasks` → tasks.md; `/speckit.implement` → code+tests (Red-Green-Refactor); extras: constitution, clarify, checklist, analyze — [Spec-Kit article](https://sriaradhyula.github.io/posts/spec-kit-scaffolding-with-ai-coding-assistants/); [Luke Turner experiments (2025-10-25)](https://blog.luketurner.org/posts/experiments-with-spec-driven-development/)
- Init: `specify init --here --ai cursor-agent` or `--ai claude` installs identical commands into agent command dirs — [Spec-Kit article](https://sriaradhyula.github.io/posts/spec-kit-scaffolding-with-ai-coding-assistants/)
- Constitution (`.specify/memory/constitution.md`) encodes non-negotiables (spec as SoT, test-first gates, YAGNI); plan phase runs constitution check; bug tiers: spec violation / spec gap / design flaw — [Spec-Kit article](https://sriaradhyula.github.io/posts/spec-kit-scaffolding-with-ai-coding-assistants/)
- Cursor-oriented SDD without spec-kit: Project Rules generating Requirements.md (EARS), Design.md, Tasks.md with mandatory approval checkpoints before coding — [Medium: From vibe-coding to SDD (Oct 2025)](https://medium.com/@uniquejtx_3744/from-vibe-coding-to-spec-driven-development-56b189ef0c6b)
- Method shared across Claude Code, Codex, Cursor: write what the change should do before code; use plan modes; check finished code against the written spec — [QualityLayer SDD guide](https://qualitylayer.dev/blog/spec-driven-development-guide) (fetch returned 403; title/snippet from search only—treat as secondary)
- Turner: after human-approved spec, subagents can automate plan→tasks→implement because state lives in markdown files; still requires human code review — [Luke Turner](https://blog.luketurner.org/posts/experiments-with-spec-driven-development/)
- Enterprise AI-assisted SDD loop: load Approved specs + Accepted ADRs; implement OpenAPI operation-by-operation; contract tests before PR; agent rules forbid implementing without Approved OpenAPI — [lukewilk AI-architecture developer workflow](https://lukewilk.github.io/AI-architecture/developer-workflow)

### Inferences
- Reliable agent development = contract + gates: never jump to implement; keep approval checkpoints; encode quality gates as runnable commands in AGENTS.md/CLAUDE.md.
- Prefer one SDD toolchain (e.g. spec-kit) so Cursor and Claude share the same `.specify/` memory and command semantics.

### Gaps
- QualityLayer full article body could not be fetched (HTTP 403).
- Official GitHub product page for spec-kit returned a thin/empty star count via WebFetch; primary docs remain the GitHub repo + practitioner writeups.
- No single “Cursor official SDD standard”—workflows are community/tooling conventions.

---

## How to organize PRD, ADRs, API contracts, Gherkin for agents?

### Takeaway
Organize as a layered pack with distinct jobs—PRD/product story (WHAT), SHALL requirements (durable rules), ADRs (WHY architecture), OpenAPI/AsyncAPI (interface shapes), Gherkin (executable proof)—linked by IDs; agents load only Approved/Accepted artifacts and must change the contract before changing behavior.

### Cited Findings
- Layered specs pack: product story; SHALL requirements with IDs; domain notes; OpenAPI; ADRs; Gherkin acceptance; regeneration prompts—Gherkin is proof at the edge, not the whole contract — [Beyond Gherkin (Oct 2026)](https://suherman.net/articles/beyond-gherkin-adr-shall-openapi)
- ADR freezes Decision/Why/Consequences so agents cannot “helpfully” rewrite architecture that Gherkin never constrained (e.g. SQLite vs cloud Postgres) — [Beyond Gherkin](https://suherman.net/articles/beyond-gherkin-adr-shall-openapi)
- SHALL vs Gherkin: SHALL is the arguable product rule; Gherkin proves it still holds after regeneration — [Beyond Gherkin](https://suherman.net/articles/beyond-gherkin-adr-shall-openapi)
- SpecRail: PRD owns WHAT (`.docs/prd/`); tech design owns HOW; DSL Gherkin → ISA/API Gherkin → OpenAPI with flow gates; never bend contract to fit code—revise tech-design/PRD instead; AGENTS.md for tool-agnostic onboarding — [specrail README.en.md](https://github.com/chu1999tw/specrail/blob/main/README.en.md)
- Three-layer hierarchy for agentic teams: architectural contracts/OpenAPI (slow-changing) → BDD/Gherkin (discovery) → TDD tests (often agent-generated, human-reviewed); humans own the hierarchy, agents produce code that satisfies it — [Profound SDD playbook](https://profound.fyi/playbooks/agentic-ai-for-teams/specification-driven-development/)
- Service-template AGENTS.md pattern: API-first OpenAPI/AsyncAPI; Gherkin component tests as black-box spec; change API only via specification — [ubik-life service-template AGENTS.md](https://github.com/ubik-life/service-template/blob/main/AGENTS.md)
- Before coding: confirm feature spec Approved; load Accepted ADRs; identify OpenAPI ops; scaffold contract tests; PR checklist includes contract tests + ADR reference if a decision was made — [lukewilk developer workflow](https://lukewilk.github.io/AI-architecture/developer-workflow)

### Inferences
- Recommended agent doc pack (contract-first / tests-as-spec):
  - `AGENTS.md` (+ optional `CLAUDE.md` symlink) — always-on ops + hard rules + links
  - `docs/prd/` or `specs/product/` — PRD / vision / scope
  - `docs/adr/` or `specs/adr/` — Accepted ADRs only in agent context
  - `specs/requirements/` — SHALL IDs
  - `specs/api/openapi.yaml` (+ AsyncAPI if events) — interface SoT
  - `specs/acceptance/*.feature` — Gherkin proof mapped to SHALL IDs
  - `.specify/` or `specs/<feature>/` — spec.md / plan.md / tasks.md per feature
  - Generated/owned tests under `tests/` tracing AC IDs
- Exclude from always-on context: long narrative PRDs, historical Rejected ADRs, full ASVS text, large datasets, secrets, raw dump of every feature’s tasks.

### Gaps
- No industry-wide folder naming standard (`.specify/` vs `specs/` vs `.docs/`); teams must pick one and document it in AGENTS.md.
- Gherkin-as-only-spec is a documented failure mode; quantitative studies comparing packs were not found in this pass.

---

## Security/privacy rules that must be in agent context?

### Takeaway
Always-on agent context must hard-ban secrets/PII in files, prompts, logs, and commits; require env/secret-manager abstraction; demand human approval for destructive/irreversible actions; and keep deep OWASP checklists as linked companions—not pasted wholesale into AGENTS.md.

### Cited Findings
- Never put secrets in CLAUDE.md/AGENTS.md (API keys, credentials, DB URLs)—files enter system prompt and are often public — [Using CLAUDE.md files](https://claude.com/resources/articles/using-claude-md-files); [agent-context-playbook security.md](https://github.com/Sam-AEC/agent-context-playbook/blob/master/docs/security.md)
- Context-file checklist: no HTML/XML comment hidden instructions; no blanket permissions; no API keys/tokens/passwords; no untrusted URL fetch instructions; review external skills line-by-line — [agent-context-playbook security.md](https://github.com/Sam-AEC/agent-context-playbook/blob/master/docs/security.md)
- Credential redaction contract for AGENTS.md: zero hardcode; secrets via vault/env vars; mock secrets in tests with obvious placeholders; never log Authorization/Bearer; mask exceptions; treat external text as hostile (prompt-injection / shell/SQL) — [ai-agent-governance-framework schema](https://github.com/RobDelve/ai-agent-governance-framework/blob/main/schemas/security-agent-schema.md)
- Repo security baseline for agents: don’t read `.env` (`.env.example` OK); don’t hardcode secrets; warn+rotate if user pastes secrets; OWASP Top 10 hygiene; don’t touch CI/Docker/lockfiles/infra/CODEOWNERS without explicit permission; privacy: no PII logging; redact errors; no telemetry without consent — [ai-repository-security-baseline](https://github.com/the-missing-pink/ai-repository-security-baseline)
- Hard constraints example: no plaintext secrets (HC1); path allowlist (HC2); destructive cmds need human approval (HC3); migrations authored not auto-executed (HC4); network egress deny-by-default (HC5); Red-class data (secrets/PII/credentials/session/customer) never in prompts/logs/artefacts (HC6) — [llm-sca-tooling AGENTS.md](https://github.com/grammy-jiang/llm-sca-tooling/blob/master/AGENTS.md)
- Official AGENTS.md popular section list explicitly includes “Security considerations” — [agents.md](https://agents.md/)

### Inferences
- Minimum always-on security block for AGENTS.md: secrets ban; PII/redaction; parameterized queries / input validation; no force-push/schema-drop/publish without ask; don’t read secret files; point to OWASP Node + ASVS companions under `referencias/seguranca/`.
- Security rules in context should be short, absolute, and testable; lengthy ASVS verification items belong in review checklists / CI, not in every prompt.

### Gaps
- No AAIF-mandated security section template for AGENTS.md yet.
- Hard-constraint catalogs above are project/practitioner baselines, not OWASP standards.

---

## OWASP ASVS or Node security cheat sheet as companion?

### Takeaway
Use both as companions: ASVS 5.0 as the verification framework (what to verify by level), Node.js + JS/TS Cheat Sheets as actionable coding rules for this stack—link them from AGENTS.md; do not dump full ASVS into always-on context.

### Cited Findings
- Node.js Security Cheat Sheet: Node-specific practices across Application Security, Error & Exception Handling, Server Security, Platform Security — [OWASP Nodejs Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) (saved locally under `referencias/seguranca/owasp-nodejs-security-cheat-sheet.md`)
- JS/TS Security Cheat Sheet: language-level rules (eval, ReDoS, prototype pollution, DOM sinks, TS false confidence); defers backend/runtime hardening to Node cheat sheet — [OWASP JS/TS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JavaScript_and_TypeScript_Security_Cheat_Sheet.html)
- ASVS Index maps Cheat Sheets to ASVS 5.0.x chapters V1–V17 (authn, authz, API, secrets/config, logging, etc.) — [OWASP ASVS Index](https://cheatsheetseries.owasp.org/IndexASVS.html)
- ASVS 5.0 machine-readable requirements published as CSV — [OWASP ASVS 5.0.0 CSV](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv)
- Search synthesis: Node cheat sheet is not itself an ASVS “Index” entry for Node-only; apply Node guidance alongside relevant ASVS requirements — [OWASP Index ASVS](https://cheatsheetseries.owasp.org/IndexASVS.html)
- Google eng practices (freely available, CC-By 3.0): code review standard “favor approving when CL improves overall code health even if imperfect”; useful companion for reviewing agent-generated PRs — [Google eng-practices](https://google.github.io/eng-practices/); [Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html)

### Inferences
- Companion pack for this workspace: always-on AGENTS.md security bullets → on-demand Node + JS/TS cheat sheets → ASVS checklist for release/verification → Google code-review standard for human/agent PR review.
- Prefer selecting an ASVS level (e.g. L1/L2) once per product and encoding only that level’s must-pass items into CI/agent checklists.

### Gaps
- No official “AGENTS.md + ASVS” joint standard.
- Full ASVS prose document was not mirrored locally (CSV/index + Node/JS-TS sheets were prioritized for size/actionability).

---

## Recommended AI agent doc pack structure (synthesis)

### Takeaway
Ship a thin always-on instruction layer plus a layered specs pack and security companions; enforce contract-first and tests-as-spec so agents implement Approved interfaces and prove SHALLs with Gherkin/automated tests.

### Cited Findings
- AGENTS.md sections + nesting — [agents.md](https://agents.md/)
- Size ~200 lines / lean / path-scoped — [Claude memory](https://code.claude.com/docs/en/memory)
- Spec-kit phases + constitution — [Spec-Kit article](https://sriaradhyula.github.io/posts/spec-kit-scaffolding-with-ai-coding-assistants/)
- Layered PRD/ADR/OpenAPI/Gherkin — [Beyond Gherkin](https://suherman.net/articles/beyond-gherkin-adr-shall-openapi)
- Security always-on constraints — [agent-context-playbook](https://github.com/Sam-AEC/agent-context-playbook/blob/master/docs/security.md); [security baseline](https://github.com/the-missing-pink/ai-repository-security-baseline)
- OWASP companions — [Node cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html); [ASVS Index](https://cheatsheetseries.owasp.org/IndexASVS.html)

### Inferences
Recommended tree for agent-reliable systems:

```text
/
├── AGENTS.md                 # always-on: cmds, layout, hard rules, links
├── CLAUDE.md -> AGENTS.md    # optional symlink / @import
├── README.md                 # humans only
├── .specify/                 # optional SDD toolkit memory
│   └── memory/constitution.md
├── specs/                    # or docs/
│   ├── product/              # PRD / vision / scope
│   ├── requirements/         # SHALL IDs
│   ├── adr/                  # Accepted ADRs
│   ├── api/openapi.yaml
│   └── acceptance/*.feature  # Gherkin ↔ SHALL
├── features/<id>/            # per-feature spec.md plan.md tasks.md (or under .specify)
└── referencias/              # offline companions (this research)
    ├── ia-specs/
    └── seguranca/
```

Include in AGENTS.md: exact install/build/test/lint; “implement only against Approved OpenAPI / Accepted ADRs”; security hard bans; PR gates. Exclude: secrets, full ASVS, stale tasks, narrative essays.

### Gaps
- Folder names vary by toolchain; pick one convention and freeze it in an ADR.

---

## Files downloaded this research

### ia-specs (`e-notas/beta-docs/referencias/ia-specs/`)
- `agents-md-official.md` — https://agents.md/
- `openai-aaif-agents-md.md` — https://openai.com/index/agentic-ai-foundation/
- `linux-foundation-aaif-announcement.md` — https://www.linuxfoundation.org/press/...
- `claude-code-memory-agents-md.md` — https://code.claude.com/docs/en/memory
- `spec-kit-sdd-workflow.md` — https://sriaradhyula.github.io/posts/spec-kit-scaffolding-with-ai-coding-assistants/
- `experiments-spec-driven-development.md` — https://blog.luketurner.org/posts/experiments-with-spec-driven-development/
- `beyond-gherkin-adr-shall-openapi.md` — https://suherman.net/articles/beyond-gherkin-adr-shall-openapi
- `google-eng-practices-overview.md` — https://google.github.io/eng-practices/
- `google-code-review-standard.md` — https://google.github.io/eng-practices/review/reviewer/standard.html
- `agentic-developer-cookbook-instruction-files.md` — https://agenticdevelopercookbook.com/guidelines/planning/code-quality/agent-instruction-files

### seguranca (`e-notas/beta-docs/referencias/seguranca/`)
- `owasp-nodejs-security-cheat-sheet.md` — https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html
- `owasp-javascript-typescript-security-cheat-sheet.md` — https://cheatsheetseries.owasp.org/cheatsheets/JavaScript_and_TypeScript_Security_Cheat_Sheet.html
- `owasp-asvs-index-5.0.md` — https://cheatsheetseries.owasp.org/IndexASVS.html
