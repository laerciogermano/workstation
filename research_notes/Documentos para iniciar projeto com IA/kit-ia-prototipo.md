# Kit de documentos para iniciar projeto com agentes de IA (2024–2026)

## What is the recommended documentation pack for AI-assisted development in 2025-2026?

### Takeaway
O pack recomendado separa (1) **instruções persistentes do agente** (AGENTS.md / CLAUDE.md / rules), (2) **artefatos de spec-driven development** (constitution → spec → plan → tasks), e (3) **artefatos de validação** (acceptance criteria, fixtures, checks). README fica humano; o agente ganha um arquivo dedicado e specs executáveis.

### Cited Findings
- `AGENTS.md` é o formato aberto transversal (“README for agents”); seções populares: project overview, build/test commands, code style, testing instructions, security — [agents.md](https://agents.md/)
- GitHub Spec Kit formaliza SDD em fases: Specify (user journeys/success) → Plan (stack/constraints) → Tasks (chunks testáveis) → Implement, com checkpoint humano em cada fase — [GitHub Blog Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- Artefatos Spec Kit típicos: `constitution.md` (princípios/guardrails), `spec.md` (what/why), `plan.md` (how técnico), `tasks.md` (unidades com AC e dependências) — [Azure AVM Spec Kit guide](https://azure.github.io/Azure-Verified-Modules/usage/ai-assisted-sol-dev/spec-kit/)
- Cursor recomenda rules curtas com: commands, conventions, pointers a exemplos canônicos, guardrails; skills para workflows sob demanda — [Cursor Customizing agents](https://cursor.com/learn/customizing-agents)
- Anthropic: `CLAUDE.md` só o que o modelo não descobre no código (commands de verificação, gotchas, decisões fora do repo); skills para procedimentos de time; hooks para regras sem exceção — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Copilot: `.github/copilot-instructions.md` + path-specific `.github/instructions/*.instructions.md` + agent files `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` — [GitHub Copilot custom instructions](https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions)
- Thoughtworks: SDD = requirements formalizados em Markdown → agent gera design/plan → implementação sob rules/AGENTS.md — [Thoughtworks SDD 2025](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices)
- JetBrains Junie: `requirements.md` → `plan.md` → `tasks.md`, executar em fases com review — [JetBrains Junie SDD](https://blog.jetbrains.com/junie/2025/10/how-to-use-a-spec-driven-approach-for-coding-with-ai/)
- AWS Kiro: user stories + acceptance criteria → technical design → task list — [InfoQ Kiro](https://www.infoq.com/news/2025/08/aws-kiro-spec-driven-agent/)

### Inferences
- **Prioritized checklist (full pack, projeto sério / além do vibe prototype)**

| Prio | Documento | Função | Conteúdo obrigatório |
|------|-----------|--------|----------------------|
| P0 | `AGENTS.md` (raiz; nested se monorepo) | Instrução portátil cross-tool | Overview curto; install/build/dev/test/lint (comandos exatos + single-file test); conventions “use X not Y”; PR/commit expectations; security/do-nots; gotchas env |
| P0 | `README.md` | Humanos | O quê, quickstart, links para specs/agent docs; **não** dump de regras do agente |
| P0 | Spec / `spec.md` (ou PRD enxuto AI-ready) | Intent / what+why | Personas; user journeys; functional reqs; success criteria; **non-goals**; edge cases explícitos |
| P0 | Acceptance criteria (na spec ou por story) | Definition of done verificável | Critérios testáveis (Given/When/Then ou bullets observáveis); “done” = comando/teste que passa |
| P1 | Tech plan / `plan.md` | How | Stack versions; architecture; data model; API contracts; folder structure; constraints/compliance; out-of-scope técnico |
| P1 | `tasks.md` | Execução incremental | Tasks pequenas, dependency-ordered, 1 unidade testável cada; AC por task; fases Setup → Foundational → per-story → Polish |
| P1 | Agent rules vendor-specific | Scoping/enforcement | Cursor: `.cursor/rules/*.mdc` (globs/alwaysApply); Claude: `.claude/rules/` + hooks; Copilot: `.github/instructions/` |
| P1 | `.env.example` + fixtures/sample data | Reprodutibilidade | Vars necessárias; dados de exemplo mínimos; seeds; golden files se output exato importa |
| P2 | `constitution.md` / design principles | North-star não negociável | Engineering standards, security, testing expectations, forbidden patterns |
| P2 | User flows (markdown/mermaid) | UX journeys | Passos tela a tela; estados empty/error/loading; decisões do usuário |
| P2 | Design tokens / UI constraints | Visual | Cores, tipografia, layout rules, a11y; refs a componentes canônicos (não style guide inteiro inline) |
| P2 | Skills / prompt files | Workflows | Deploy, PR, release, “fix-issue” — carregados sob demanda |
| P3 | Architecture ADR / diagrams | Decisões | Só decisões caras de redescobrir; apontar arquivos canônicos |
| P3 | OpenAPI / schema / contracts | Interface estável | Contratos versionados que o agente deve estender, não reinventar |
| P3 | Copilot/Claude/Gemini duplicates | Compat | Symlink ou gerar `CLAUDE.md`/`GEMINI.md` a partir de `AGENTS.md` se multi-tool |

- Pack **mínimo protótipo** vs **full**: ver seção “Minimum set…” abaixo.
- PRD clássico / architecture bible longos **não** são o núcleo 2025–26; o núcleo é agent instructions curtos + spec/plan/tasks vivos + checks.

### Gaps
- Não há um “ISO” único do pack além de `AGENTS.md` + práticas SDD; composição exata varia por vendor.
- Poucas fontes oficiais listam “fixtures” como documento de kickoff nomeado; aparece indiretamente via testes, `.env.example`, e falhas de “exact string/invariant”.

---

## Official guidance from Cursor, Anthropic Claude Code, OpenAI Codex/Copilot, Google, Vercel v0, etc.?

### Takeaway
Todos os vendors principais convergiram para **Markdown de instruções no repo**, com `AGENTS.md` como padrão aberto; cada um adiciona um formato proprietário para scoping (Cursor `.mdc`, Copilot path instructions, Claude rules/hooks). Spec Kit / SDD é o complementary pack de produto, não o arquivo de “system prompt” do agente.

### Cited Findings

#### Cursor
- Quatro tipos: Project Rules (`.cursor/rules`), User Rules, Team Rules, `AGENTS.md` — [Cursor Rules docs](https://cursor.com/docs/rules)
- Project rules = `.mdc` com frontmatter `alwaysApply` / `globs` / `description`; `.md` em `.cursor/rules` é **ignorado** — [Cursor Rules docs](https://cursor.com/docs/rules)
- Best practices: <500 lines/rule; split; exemplos/refs `@file`; evitar style guides inteiros e listar todo comando — [Cursor Rules docs](https://cursor.com/docs/rules); [Customizing agents](https://cursor.com/learn/customizing-agents)
- Nested `AGENTS.md` em subdirs; mais específico prevalece — [Cursor Rules docs](https://cursor.com/docs/rules)
- Precedência Team → Project → User quando conflita — [Cursor Rules docs](https://cursor.com/docs/rules)
- Skills = dynamic context (`SKILL.md`) vs rules = static — [Customizing agents](https://cursor.com/learn/customizing-agents)
- Falha comum: over-engineering de rules consome contexto e confunde — [Customizing agents](https://cursor.com/learn/customizing-agents)

#### Anthropic Claude Code
- Locais: managed policy → `~/.claude/CLAUDE.md` → `./CLAUDE.md` ou `./.claude/CLAUDE.md` → `CLAUDE.local.md` (gitignore) — [Claude Code CLAUDE.md docs](https://code.claude.com/docs/en/claude-md)
- `/init` gera starter; manter curto (~200 linhas); só o não-óbvio — [best practices](https://code.claude.com/docs/en/best-practices)
- Conteúdo típico exemplar: Commands, Conventions, Gotchas — [best practices](https://code.claude.com/docs/en/best-practices)
- `.claude/rules/` com `paths:` para scoping; skills para procedimentos; hooks/deny para deterministic enforcement — [best practices](https://code.claude.com/docs/en/best-practices)
- Prompt específico > fluff; brainstorm → escrever `SPEC.md` → sessão limpa para implementar — [best practices](https://code.claude.com/docs/en/best-practices)

#### OpenAI Codex / AGENTS.md stewardship
- Codex lê `AGENTS.md` antes do trabalho; global `~/.codex` + walk root→cwd; override files; default cap **32 KiB** — [ChatGPT Learn AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- Mais próximo no tree vence; prompt do usuário override — [agents.md FAQ](https://agents.md/); [Codex hierarchical template](https://github.com/openai/codex/blob/main/codex-rs/prompts/templates/agents/hierarchical.md)
- Seções exemplo: Dev environment tips, Testing instructions, PR instructions — [agents.md](https://agents.md/)
- Formato stewarded sob Agentic AI Foundation / Linux Foundation; usado por 60k+ projects; emergiu de Codex, Amp, Jules, Cursor, Factory — [agents.md](https://agents.md/)
- InfoQ (ago/2025): já em 20k+ repos; portátil Codex, Jules, Cursor, Aider, RooCode, Zed — [InfoQ AGENTS.md](https://www.infoq.com/news/2025/08/agents-md/)

#### GitHub Copilot
- Repo-wide: `.github/copilot-instructions.md`; path-specific: `.github/instructions/NAME.instructions.md` + frontmatter `applyTo`; agents: `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` — [Copilot custom instructions](https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions); [how-to add repo instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)
- Escrever: short self-contained statements; overview + libs/frameworks + coding standards; evitar “sempre cite styleguide externo” / micro-style de resposta — [Copilot custom instructions](https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions)
- Spec Kit oficial para Copilot + Claude Code + Gemini CLI — [GitHub Blog Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)

#### Google Jules
- Lê `AGENTS.md` na raiz automaticamente para contexto/planos; setup scripts no ambiente VM — [Jules Getting started](https://jules.google/docs/); changelog 2025-06-20 — [Jules changelog](https://jules.google/docs/changelog/2025-06-20/)
- Nota: Jules encerra 31 Dec 2026; aprendizados vão para “Google Antigravity” — [Jules changelog](https://jules.google/docs/changelog/) (contexto de produto; AGENTS.md permanece padrão do ecossistema)

#### Vercel v0
- Prompt framework: Product surface + Context of use + Constraints & taste — [How to prompt v0](https://vercel.com/blog/how-to-prompt-v0)
- Project instructions (Knowledge) em toda mensagem: regras duráveis curtas; Sources = docs longas sob demanda; style-guide deve ir em instructions, não só sources — [Vercel community: Custom instructions in v0](https://community.vercel.com/t/custom-instructions-in-v0/16782)
- Built-in “Plan Mode” instruction: plano detalhado + aprovação antes de implementar — [v0 Instructions docs](https://v0docs.vercel.sh/docs/instructions)

#### Outros
- Devin / Windsurf / Gemini CLI / Junie / Amp listados como consumidores de AGENTS.md — [agents.md](https://agents.md/)
- Workaround multi-tool comum: `ln -s AGENTS.md CLAUDE.md` — [Cursor forum](https://forum.cursor.com/t/agent-open-format-for-guiding-coding-agents/131019)

### Inferences
- **Canonical portable file = `AGENTS.md`**. Adicionar vendor files só quando precisar de globs, hooks, org policy ou features que AGENTS não cobre.
- **Não duplicar** o mesmo texto longo em README + AGENTS + CLAUDE + copilot-instructions; uma fonte + symlinks/geração.
- Official guidance enfatiza **curto + acionável + verificável**, não documentação exaustiva no contexto sempre-carregado.

### Gaps
- Documentação oficial Devin (Cognition) sobre kickoff docs além do suporte AGENTS.md listado em agents.md não foi encontrada em profundidade nesta rodada.
- Posição exata de `AGENTS.md` na ordem de precedência Cursor Team/Project/User não está explicitada nos docs oficiais de Rules (terceiros notam a lacuna).

---

## How should specs be written for AI (structured markdown, unambiguous acceptance criteria, examples, non-goals)?

### Takeaway
Specs para agentes devem ser **Markdown estruturado, literal e verificável**: what/why separado de how; critérios de sucesso observáveis; non-goals explícitos; exemplos concretos; tasks atômicas. Modelos completam padrões — ambiguidade vira invenção.

### Cited Findings
- Spec Kit Specify: user journeys, experiences, success — **não** stack; Plan: stack, architecture, constraints, compliance, performance — [GitHub Blog Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- `spec.md` deve incluir: feature description, user/problem, functional/NFR, scenarios & constraints, I/O expectations, success criteria; plan: stack, architecture, component breakdown, API/data contracts, integrations, deployment, research/assumptions; tasks: ordered granular units + AC + deps — [Azure AVM Spec Kit](https://azure.github.io/Azure-Verified-Modules/usage/ai-assisted-sol-dev/spec-kit/)
- Vague prompt (“add photo sharing”) força milhares de requisitos implícitos; spec+plan+tasks remove guessing — [GitHub Blog Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- Tasks exemplo bom: “create user registration endpoint that validates email format” ≠ “build authentication” — [GitHub Blog Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- Junie: não pedir “implement everything”; fases + marcar progresso em `tasks.md` + review — [JetBrains](https://blog.jetbrains.com/junie/2025/10/how-to-use-a-spec-driven-approach-for-coding-with-ai/)
- Claude: interview até poder escrever spec; “be ambitious” para escopo; hand over files/screenshots; nomear arquivo + sintoma + “fixed looks like” — [best practices](https://code.claude.com/docs/en/best-practices)
- v0: listar components/data/actions; quem/quando/decisão; constraints que dizem o que **não** inventar — [How to prompt v0](https://vercel.com/blog/how-to-prompt-v0)
- Copilot instructions: short self-contained; overview + frameworks + standards — [Copilot docs](https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions)
- Cursor rules: “Avoid vague guidance. Write rules like clear internal docs”; pointer to canonical files — [Cursor Rules](https://cursor.com/docs/rules)
- Microsoft DevAX: agentes tratam docs como autoritativos; exemplos com versões pinadas viram âncora; tips suaves não derrubam plano prévio — preferir “X causes build failure” a “consider Y” — [AX failure patterns](https://microsoft.github.io/agent-experience/playbook/common-failure-patterns/)
- Red Hat “spec coding”: humans definem what + how guardrails; múltiplos how-specs scoped (arch, test, security) sem overlap; lessons-learned file — [Red Hat](https://developers.redhat.com/articles/2025/10/22/how-spec-driven-development-improves-ai-coding-quality)

### Inferences
- **Template recomendado de spec (AI-ready)**
  1. Problem / who / why
  2. User flows (happy + empty/error)
  3. Functional requirements (numerados)
  4. Non-functional (perf, a11y, security) se importam
  5. **Non-goals / out of scope**
  6. Success / acceptance criteria (testáveis)
  7. Examples / fixtures / sample payloads
  8. Open questions (ou rodar clarify antes do plan)
- **Template de agent instructions** (AGENTS/CLAUDE/rules): Commands → Conventions (use/don’t) → Architecture pointers → Guardrails → PR/test expectations → Gotchas
- Preferir **contradições explícitas do caminho errado** e **checks mecânicos** (test/lint/typecheck/hooks) a ênfase (“IMPORTANT”)
- Manter always-on docs **curtos**; specs longas vivem em arquivos referenciados, não no system context inteiro

### Gaps
- Não há schema obrigatório de campos para AGENTS.md (só Markdown livre) — [agents.md FAQ](https://agents.md/)
- Padrão Gherkin vs bullets de AC: ambas usadas; nenhuma fonte oficial impõe Gherkin

---

## Minimum set to start a prototype vs fuller set?

### Takeaway
Protótipo: 3–5 artefatos curtos bastam (intent + agent instructions + verify command + constraints). Produto/feature em codebase real: pack SDD completo + rules scoped + fixtures/contracts.

### Cited Findings
- Spec Kit: greenfield ainda se beneficia de “small amount of upfront spec+plan” vs só coding; vibe-coding ok para quick prototypes mas frágil em apps sérios / codebases existentes — [GitHub Blog Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- Cursor: start simple; add rules when agent repeats mistakes — [Customizing agents](https://cursor.com/learn/customizing-agents); [Rules](https://cursor.com/docs/rules)
- Claude: `/init` + trim; don’t document what code already shows — [best practices](https://code.claude.com/docs/en/best-practices)
- v0: prompts com surface+context+constraints bastam para UI prototype; project instructions para regras duráveis — [How to prompt v0](https://vercel.com/blog/how-to-prompt-v0); [community Knowledge](https://community.vercel.com/t/custom-instructions-in-v0/16782)
- agents.md: create file → cover what matters → nest later for monorepo — [agents.md](https://agents.md/)
- Codex: keep AGENTS small; raise byte limit or nest when hitting 32KiB — [ChatGPT Learn](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

### Inferences

#### Minimum (prototype / spike, ~1–3 dias)
1. **`AGENTS.md`** (ou CLAUDE.md se só Claude): commands + 5–10 conventions/guardrails
2. **One-pager intent** (`SPEC.md` ou seção no README): product surface, who/when, constraints, non-goals
3. **Acceptance smoke**: “done = `npm test` / checklist manual de 3–5 pontos”
4. **`.env.example`** se houver secrets/config
5. *(UI)* constraints de visual / ref de design OU project instructions no v0

Opcional no mínimo: `tasks.md` de 5–15 bullets se o protótipo tiver >1 superfície.

#### Fuller (feature real / team / multi-agent)
1. Tudo do mínimo
2. `constitution.md` (ou sempre-on rules org)
3. `spec.md` + clarify
4. `plan.md` (+ data-model/contracts/quickstart se Spec Kit)
5. `tasks.md` fatiado
6. Vendor rules scoped (`.cursor/rules`, `.claude/rules`, `.github/instructions`)
7. Fixtures/seeds + OpenAPI/schema
8. User flows + design tokens
9. Skills para PR/deploy/review
10. Hooks/CI como enforcement determinístico

#### Regra prática
- Se o agente **erra o mesmo padrão 2×** → promove para AGENTS/rules
- Se a tarefa é **grande/ambígua** → spec+plan+tasks antes de código
- Se a regra **não pode falhar** → hook/CI, não só Markdown

### Gaps
- Nenhuma fonte oficial publica um “minimum checklist” numerado idêntico; a divisão mínimo/full acima é síntese das práticas oficiais + SDD.

---

## Common failure modes when docs are missing for AI agents?

### Takeaway
Sem docs boas, agentes **inventam** requisitos, **escolhem defaults de training data**, **ignoram invariantes**, e **gastam tokens** rediscovering. Docs ruins (stale/ambíguas/incompletas) podem ser piores que ausência parcial porque o agente confia nelas.

### Cited Findings
- Missing context → plausible invention; undocumented auth/rate limits; interactions entre sistemas documentados em silos — [Docs As Code](https://docsascode.co/posts/how-doc-quality-affects-what-an-agent-gets-wrong)
- Stale docs → respostas confiantes e desatualizadas; fragmented retrieval sem preconditions — [Docs As Code](https://docsascode.co/posts/how-doc-quality-affects-what-an-agent-gets-wrong)
- GitBook experiment: content gaps caros (retries/API thrash); drift/inconsistency → “success” errado; agents trust docs over prior knowledge; sem docs, agentes não adivinham produto — [GitBook research](https://www.gitbook.com/research/docs-defect-experiment)
- DevAX: agent ignores extension / uses training data; follows docs too literally (pinned versions); already has a plan so soft tips ignored — [Microsoft AX playbook](https://microsoft.github.io/agent-experience/playbook/common-failure-patterns/)
- Cursor before/after: sem rules → Jest vs Vitest, CSS modules vs Tailwind, API routes no lugar errado — [Customizing agents](https://cursor.com/learn/customizing-agents)
- Claude: missing invisible knowledge; “said done” without check; must-never/must-always sem enforcement — [best practices](https://code.claude.com/docs/en/best-practices)
- Spec Kit: vibe-coding looks right but doesn’t work / misses intent / wrong stack — [GitHub Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- v0 sem context: placeholders non-functional, not responsive; vague surface → code extra e features erradas — [How to prompt v0](https://vercel.com/blog/how-to-prompt-v0)
- Arxiv compact-docs: failures omit exact test strings, drop imports, lose invariants (e.g. immutability); syntax/import breakage; **longer docs can slightly hurt** when source already present — [arXiv:2609.31587](https://arxiv.org/pdf/2609.31587)
- AGENTS.md limitations: not a security boundary; long files dilute attention; stale instructions; tool-defined precedence — [Arize glossary](https://arize.com/glossary/agents-md/)
- Context gaps: wrong retrieval, cross-service logic, conventions, existing similar impl, infra/config — [Kognita](https://www.kognita.co/blog/how-to-give-ai-coding-tools-better-codebase-context)

### Inferences
- **Failure → doc fix mapping**
  - Inventa feature/stack → spec non-goals + plan stack pinned
  - Erra convenção do time → AGENTS/rules + canonical file pointer
  - “Done” falso → acceptance criteria + test/typecheck command + Stop hook/CI
  - Edita generated/ secrets → deny rules/hooks + do-not list
  - Quebra edge cases → fixtures + explicit edge cases na spec
  - Segue exemplo pinado → docs com `@latest` / declarar versão canônica
  - Confia em doc stale → treat agent docs as living; PR review das instructions
  - Arquivo enorme de rules → split/skills; trim always-on context

### Gaps
- Evidência quantitativa ampla “% de falhas por tipo de doc ausente” ainda é limitada a experimentos pontuais (GitBook, arXiv); generalização cross-domain é inferência.
- Poucos estudos medem especificamente a ausência de `AGENTS.md` vs ausência de spec SDD em isolamento.

---

## Appendix: Exemplary open sources / starting points

### Cited Findings
- Spec Kit toolkit: `uvx --from git+https://github.com/github/spec-kit.git specify init` — [GitHub Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/); repo [github/spec-kit](https://github.com/github/spec-kit)
- AGENTS.md examples citados: openai/codex, apache/airflow, temporalio/sdk-java — [agents.md](https://agents.md/)
- OpenAI monorepo: dezenas/`88` AGENTS.md nested (claim no site) — [agents.md](https://agents.md/)
- Community Copilot instructions: [github/awesome-copilot](https://github.com/github/awesome-copilot/)
- agents.md GitHub mirror/stewardship: [openai/agents.md](https://github.com/openai/agents.md/) / [agents.md](https://agents.md/)

### Inferences
- Para kickoff: `specify init` **ou** `/init` (Claude) **ou** scaffold AGENTS.md + one-pager SPEC é o caminho mais alinhado a 2025–26.
- Exemplares reais de monorepo com nested AGENTS.md valem mais que templates genéricos de “1000 rules”.
