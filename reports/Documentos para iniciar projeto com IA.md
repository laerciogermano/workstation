# Documentos certos liberam o protótipo

Para uma IA desenvolver bem um protótipo em 2025–2026, o pack mínimo não é um PRD de 30 páginas: é um **one-pager de intent** (problema, público, non-goals, critérios de sucesso), **`AGENTS.md`** com comandos e guardrails, **critérios de aceite verificáveis**, um **MVDS** (tokens semânticos + poucos componentes com estados) e, se houver stack irreversível, **overview de arquitetura + C4 Context/Container + ADRs**. O conjunto completo acrescenta Spec Kit (`spec` → `plan` → `tasks`), rules por vendor, fixtures/contratos e superfície machine-readable (`tokens.json`, OpenAPI, `llms.txt`). A mudança contemporânea é clara: docs humanos ficam curtos e vivos; specs para agentes ficam literais, fatiadas e testáveis — ambiguidade vira invenção. ([Product Consortium](https://www.theproductconsortium.com/articles/product-101-prd-is-dead); [agents.md](https://agents.md/); [GitHub Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/))

## Checklist priorizado: mínimo vs pack completo

### Mínimo para protótipo (1–3 dias / spike)

| Prio | Documento | Por quê |
|------|-----------|---------|
| P0 | One-pager / `SPEC.md` (PRD enxuto) | Intent sem ambiguidade: o quê, para quem, o que **não** fazer |
| P0 | `AGENTS.md` | Instruções portáteis do agente (comandos, convenções, do-nots) |
| P0 | Acceptance smoke | “Done” = comando ou checklist observável de 3–5 pontos |
| P0 | Constraints de UI / tokens mínimos | Evita inventar visual e stack de estilo |
| P1 | `.env.example` | Reprodutibilidade se houver config/secrets |
| P1 | `tasks.md` curto (5–15 itens) | Só se houver mais de uma superfície |

Fontes: [GitHub Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/), [Cursor Customizing agents](https://cursor.com/learn/customizing-agents), [Claude Code best practices](https://code.claude.com/docs/en/best-practices), [How to prompt v0](https://vercel.com/blog/how-to-prompt-v0).

### Pack completo (feature real / time / multi-agente)

| Prio | Documento | Função |
|------|-----------|--------|
| P0 | `README.md` | Humanos: o quê, quickstart, links — **não** dump de regras do agente |
| P0 | `AGENTS.md` (+ nested em monorepo) | Instrução cross-tool |
| P0 | `spec.md` / PRD AI-ready | What + why + journeys + non-goals + AC |
| P0 | Acceptance criteria (na spec ou por story) | Definition of done testável |
| P1 | `plan.md` | How: stack, arquitetura, contratos, constraints |
| P1 | `tasks.md` | Unidades ordenadas, 1 testável cada |
| P1 | Architecture overview + C4 Context/Container | Estrutura compartilhada |
| P1 | ADRs (stack / one-way doors) | Porquê das decisões caras |
| P1 | Vendor rules (`.cursor/rules`, `.claude/rules`, etc.) | Scoping e enforcement |
| P1 | MVDS: foundations + tokens + core components | Visual e estados sem inventar |
| P1 | `.env.example` + fixtures/seeds | Reprodutibilidade e edge cases |
| P2 | `constitution.md` | Princípios não negociáveis |
| P2 | User flows (md/mermaid) | Happy + empty/error/loading |
| P2 | Skills / prompt files | Workflows sob demanda (PR, deploy) |
| P3 | OpenAPI / schemas | Contratos estáveis |
| P3 | Threat model / WAFR | Quando houver auth, PII ou exposição real |
| P3 | `llms.txt` / MCP surface | Índice para agentes |
| P3 | Symlinks `CLAUDE.md` / `GEMINI.md` | Compat multi-tool a partir de `AGENTS.md` |

Regra prática: se o agente **erra o mesmo padrão 2×** → promove para AGENTS/rules; se a tarefa é **grande/ambígua** → spec+plan+tasks antes de código; se a regra **não pode falhar** → hook/CI, não só Markdown. ([Microsoft AX playbook](https://microsoft.github.io/agent-experience/playbook/common-failure-patterns/); [Cursor Rules](https://cursor.com/docs/rules))

---

## Cada documento: nome, propósito, conteúdo, quando opcional

### 1. One-pager / Product brief / PRD enxuto (`SPEC.md` ou `docs/product/one-pager.md`)

**Propósito:** alinhar *por quê* e *o quê* antes de código; documento vivo, não contrato waterfall.

**Conteúdo obrigatório:**
1. Problem statement (1 frase, solution-agnostic)
2. Evidência / “why now”
3. Audience / persona
4. Goals + **non-goals**
5. Success metrics (primária + guardrails) — no protótipo: sucesso do *aprendizado*
6. Assumptions, risks, open questions
7. Scope in/out + prioridade (P0/MoSCoW)
8. Solution sketch: cenários / stories / links de mock (não romance)
9. Dependencies / constraints

**Opcional / escala:** milestones (estilo Linear: Context → Usage scenarios → Milestones), GTM, analytics events, NFRs, seções AI (eval thresholds, fallbacks, behavioral never-dos). ([Lenny / Confluence](https://www.atlassian.com/software/confluence/templates/lennys-product-requirements); [Nan Yu / Linear](https://www.linkedin.com/posts/thenanyu_linear-example-prd-priority-micro-adjust-activity-7264312237106860033-ndt5); [AI PRD Template](https://www.productcompass.pm/p/ai-prd-template); [Adaline Labs](https://labs.adaline.ai/p/ai-prd-missing-sections))

**Quando opcional:** quase nunca no kickoff com IA — sem intent explícito o agente inventa features. Em labs com “prototype-over-PRD”, o protótipo *é* o artefato de alinhamento, mas ainda precisa de 1 página de *why* + constraints. ([Howardism](https://www.howardism.dev/articles/prototype-over-prd))

**Não confundir camadas:** brief/problem = why/whether; PRD = what; stories = fatias; AC = done da fatia; success metrics = outcome pós-ship. ([Productboard Product Brief](https://www.productboard.com/glossary/product-brief/))

---

### 2. `AGENTS.md` (canônico portátil)

**Propósito:** “README for agents” — o que o modelo **não** descobre só lendo código.

**Conteúdo obrigatório:**
- Overview curto do projeto
- Comandos exatos: install / build / dev / test / lint (+ teste de um arquivo)
- Conventions “use X, not Y” + ponteiros a arquivos canônicos
- Security / do-nots (secrets, pastas geradas, etc.)
- Expectativas de PR/commit
- Gotchas de env

**Opcional:** nested `AGENTS.md` por pacote; symlinks para `CLAUDE.md`/`GEMINI.md`; limite típico Codex **32 KiB**. ([agents.md](https://agents.md/); [ChatGPT Learn AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md); [Claude CLAUDE.md](https://code.claude.com/docs/en/claude-md))

**Quando opcional:** só em spike de horas com um único vendor e prompt colado — ainda assim, 5–10 guardrails em arquivo batem prompt solto.

---

### 3. `README.md`

**Propósito:** onboarding humano.

**Conteúdo:** o quê é o projeto; quickstart; links para `SPEC`, arquitetura, design, `AGENTS.md`.

**Quando opcional:** nunca em repo que outra pessoa (ou você em 2 semanas) vai abrir. Não duplicar regras longas do agente aqui.

---

### 4. Spec Kit — `constitution.md` → `spec.md` → `plan.md` → `tasks.md`

**Propósito:** Spec-Driven Development: separar what/why de how e fatiar execução. ([GitHub Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/); [Azure AVM Spec Kit](https://azure.github.io/Azure-Verified-Modules/usage/ai-assisted-sol-dev/spec-kit/))

| Arquivo | Obrigatório | Conteúdo |
|---------|-------------|----------|
| `constitution.md` | P2 | Princípios, security, testing, forbidden patterns |
| `spec.md` | P0 (full) | Personas; journeys; reqs funcionais; NFRs se importam; **non-goals**; edge cases; I/O; success/AC; exemplos/fixtures; open questions |
| `plan.md` | P1 | Stack pinada; arquitetura; data model; API contracts; pasta; compliance; out-of-scope técnico |
| `tasks.md` | P1 | Tasks atômicas (“create registration endpoint that validates email” ≠ “build auth”); deps; AC por task; fases Setup → Foundational → stories → Polish |

**Quando opcional:** no mínimo protótipo, um `SPEC.md` único pode fundir intent+AC; `constitution`/`plan`/`tasks` entram quando ambiguidade ou multi-sessão de agente.

---

### 5. Acceptance criteria + smoke de verificação

**Propósito:** impedir “disse que está pronto” sem prova.

**Conteúdo:** critérios observáveis (Given/When/Then ou bullets); comando canônico (`npm test`, typecheck); no protótipo, checklist manual de 3–5 pontos aceitável.

**Quando opcional:** nunca se a IA for implementar — sem AC, “done” é teatro. ([Claude best practices](https://code.claude.com/docs/en/best-practices))

---

### 6. Vendor rules / skills

**Propósito:** scoping e enforcement além do `AGENTS.md`.

| Vendor | Onde | Conteúdo típico |
|--------|------|-----------------|
| Cursor | `.cursor/rules/*.mdc` | Frontmatter `alwaysApply` / `globs`; &lt;500 linhas; exemplos `@file` |
| Claude | `.claude/rules/` + hooks | `paths:`; hooks/deny para must-never |
| Copilot | `.github/copilot-instructions.md` + `instructions/*.instructions.md` | Statements curtos; `applyTo` |

Skills = workflows sob demanda (PR, release), não contexto always-on. ([Cursor Rules](https://cursor.com/docs/rules); [Copilot custom instructions](https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions))

**Quando opcional:** no mínimo; adicione quando o agente repetir o mesmo erro.

---

### 7. Architecture overview / design doc

**Propósito:** visão compartilhada da solução técnica (Minimum Viable Architecture). ([BCG MVA](https://www.bcg.com/x/the-multiplier/minimum-viable-architecture-in-product-development); [Google SWE Ch. 10](https://abseil.io/resources/swe-book/html/ch10.html))

**Conteúdo obrigatório:**
- Metadata (autor, status, last updated)
- Problem / background
- Goals e non-goals
- Constraints
- Proposed architecture (link C4)
- Top 3–5 quality attributes
- Tech stack summary + ponteiros a ADRs
- Main data flows / cenários críticos
- Alternatives considered
- Risks / open questions
- Security/privacy notes (mesmo breves)

**Quando opcional:** spike UI-only sem backend. Em web app com dados/API, obrigatório curto.

---

### 8. C4 diagrams (Context + Container)

**Propósito:** mapa estrutural legível por humanos e agentes (Mermaid/Structurizr preferível a binário). ([c4model.com](https://c4model.com/); [C4 FAQ](https://c4model.com/faq))

**Context:** sistema em escopo; users; sistemas externos; relações rotuladas.  
**Container:** unidades deployáveis + tech; data stores; protocolos; responsabilidades.

**Opcional no protótipo:** Component/Code, Deployment, Dynamic.  
**Produção:** Deployment + Dynamic fortes; Component conforme complexidade.

---

### 9. ADRs (`docs/decisions/nnnn-title.md`)

**Propósito:** registrar decisões arquiteturalmente significativas (estrutura, NFRs, deps, interfaces, técnicas). ([Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions); [Fowler ADR](https://www.martinfowler.com/bliki/ArchitectureDecisionRecord.html); [MADR](https://adr.github.io/madr/))

**Mínimo:** Title; Status; Context; Decision (“We will…”); Consequences; Alternatives.  
**Full (MADR):** drivers; pros/cons; confirmation/fitness functions; revisit triggers.

**Quando opcional:** zero decisões de stack. Caso contrário, 1 ADR por escolha cara (linguagem, framework, DB, auth, hosting).

---

### 10. Data model sketch

**Propósito:** C4 não cobre dados — precisa ERD/notas. ([C4 FAQ](https://c4model.com/faq))

**Conteúdo:** entidades/aggregates; ownership; IDs/uniqueness; campos sensíveis; source of truth vs cache; approach de migration.

**Quando opcional:** protótipo 100% mock/hardcoded. Obrigatório assim que houver persistência real.

---

### 11. OpenAPI / contratos de API

**Propósito:** superfície HTTP machine-readable. ([OAS v3.2.0](https://spec.openapis.org/oas/v3.2.0.html))

**Conteúdo:** `info`, `servers`, `paths`, schemas, erros, `securitySchemes`, examples não-sensíveis, política de versionamento; idealmente CI anti-drift.

**Quando opcional:** sem boundary HTTP. Draft OK no protótipo; produção = contrato + CI.

---

### 12. Threat model / readiness de produção

**Propósito:** “o que pode dar errado?” antes de usuários reais. ([OWASP Threat Modeling](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html); [AWS WAFR](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-review-process.html))

**Conteúdo:** escopo/assets; DFD + trust boundaries; STRIDE; respostas; requisitos de segurança; residual risk.

**Quando opcional:** protótipo local sem PII/auth real. Obrigatório antes de exposição + dados sensíveis. arc42 completo e WAFR ficam para maturidade/risco, não dia 1. ([arc42](https://arc42.org/overview/))

---

### 13. Design system — Foundations / MVDS

**Propósito:** fonte de verdade visual para design **e** codegen de IA. ([zeroheight structure](https://zeroheight.com/learn/how-to-structure-your-design-system-documentation/); [Material 3](https://m3.material.io/get-started); [Atlassian Foundations](https://atlassian.design/foundations/))

**Foundations (obrigatório no MVDS):**
- Cores semânticas (roles, não só swatches)
- Tipografia (escala + papéis)
- Spacing / sizing / radius
- Breakpoints / layout
- Estados de interação definidos **uma vez** (default, hover, focus, active, disabled, loading, error, empty)
- Regras de contraste / a11y
- Naming alinhado design↔código

**Brand (fatia UI):** logo, palette HEX, typefaces, voice/tone para copy de UI — brand book ≠ DS. ([Brandbooks template](https://www.brandbooks.app/brand-guidelines-template))

**Quando opcional:** protótipo throwaway sem UI. Para qualquer UI que a IA vá construir, MVDS é P0.

---

### 14. Tokens (Figma variables / DTCG JSON / CSS vars)

**Propósito:** tokens machine-readable; spec estável DTCG **2025.10**. ([DTCG announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/); [Figma tokens](https://www.figma.com/resource-library/design-tokens/))

**Conteúdo:** Primitive → Semantic (+ Component se preciso); modes por **um** eixo (light/dark **ou** brand); prioridade: color, spacing, typography; export CSS/JSON com os mesmos nomes. Caminho rápido: tokens semânticos estilo [shadcn theming](https://ui.shadcn.com/docs/theming).

**Quando opcional:** só se foundations forem CSS hardcoded com nomes estáveis — ainda assim, arquivo de tokens ajuda o agente.

---

### 15. Component docs + Storybook (ou open-code)

**Propósito:** comportamento executável + uso/a11y em prosa (Autodocs sozinho não basta). ([Storybook writing-docs](https://storybook.js.org/docs/writing-docs); [Spectrum SWC](https://opensource.adobe.com/spectrum-web-components/guides/adding-component/))

**Por componente:** purpose; when to use/not; anatomy; variants; states; content; behavior; a11y; code/example; do/don’t.

**MVDS típico:** Button (todos os estados), Input (label/error/helper), Modal/Dialog, Card, Link, um Stack/Grid. ([Tequity MVDS](https://tequity.tech/insights/design-system-for-startups))

**Patterns (P2):** forms, empty/loading/error, confirmação destrutiva, navegação.

**Quando opcional:** Storybook site completo no dia 1; o mínimo é componentes no repo + notas de uso/estados. Deferir icon set completo, motion system, multi-brand e governança RFC.

---

### 16. Superfície para agentes de design (`llms.txt`, MCP, anti-patterns)

**Propósito:** indexar docs canônicos e regras “não invente div raw / use tokens”. Exemplos: [USWDS llms.txt](https://designsystem.digital.gov/llms.txt), [Spectrum Design Data](https://opensource.adobe.com/spectrum-design-data/), [Carbon MCP](https://carbondesignsystem.com/), [shadcn AI-Ready](https://ui.shadcn.com/docs).

**Quando opcional:** no mínimo, rules de UI dentro de `AGENTS.md` bastam; `llms.txt`/MCP quando o DS crescer.

---

### 17. `.env.example` + fixtures / seeds

**Propósito:** o agente não inventa vars nem strings de teste.

**Quando opcional:** zero config. Caso contrário, P1 — falhas por omissão de exact strings/invariants são comuns. ([arXiv compact-docs](https://arxiv.org/pdf/2609.31587); [GitBook research](https://www.gitbook.com/research/docs-defect-experiment))

---

## O que cada artefato evita (falhas típicas de IA)

| Sintoma | Documento que corrige |
|---------|----------------------|
| Inventa feature/stack | Spec non-goals + plan com stack pinada |
| Jest vs Vitest / CSS errado | `AGENTS.md` / rules + ponteiro canônico |
| “Done” falso | AC + comando de teste + hook/CI |
| Edita secrets/generated | do-not list + deny hooks |
| Quebra edge cases | fixtures + edge cases na spec |
| Doc stale confiante | docs vivos no mesmo PR do código |
| Rules gigantes diluem atenção | split + skills; trim always-on |

Fontes: [Docs As Code](https://docsascode.co/posts/how-doc-quality-affects-what-an-agent-gets-wrong); [Cursor Customizing agents](https://cursor.com/learn/customizing-agents); [Arize AGENTS.md](https://arize.com/glossary/agents-md/).

---

## Estrutura de pastas recomendada (kickoff pack)

```text
/
├── README.md
├── AGENTS.md                 # fonte canônica; opcional: ln -s → CLAUDE.md
├── SPEC.md                   # one-pager (protótipo) OU apontar para docs/specs/
├── .env.example
├── llms.txt                  # opcional: índice dos docs abaixo
│
├── .cursor/rules/            # *.mdc com globs (se Cursor)
├── .claude/rules/            # se Claude Code
├── .github/
│   ├── copilot-instructions.md
│   └── instructions/         # path-specific
│
├── docs/
│   ├── product/
│   │   └── one-pager.md      # ou brief → prd
│   ├── specs/                # Spec Kit / SDD
│   │   ├── constitution.md
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── tasks.md
│   ├── architecture/
│   │   ├── overview.md
│   │   └── c4/
│   │       ├── context.md    # Mermaid/Structurizr
│   │       └── container.md
│   ├── decisions/            # ADRs MADR/Nygard
│   │   └── 0001-stack.md
│   ├── api/
│   │   └── openapi.yaml
│   ├── data/
│   │   └── model.md
│   ├── security/
│   │   └── threat-model.md   # quando necessário
│   └── design/
│       ├── foundations.md
│       ├── brand-ui.md
│       ├── tokens.json       # DTCG-friendly
│       ├── components/       # 1 md por componente core
│       └── patterns/
│
├── fixtures/                 # sample payloads / seeds
└── src/ …                    # código + CSS vars alinhadas aos tokens
```

Bootstrap alinhado a 2025–26: `uvx --from git+https://github.com/github/spec-kit.git specify init` **ou** Claude `/init` **ou** scaffold manual de `AGENTS.md` + `SPEC.md`. ([github/spec-kit](https://github.com/github/spec-kit))

---

## Conclusion

O pacote moderno para IA não compete com o PRD clássico — **substitui o contrato estático** por intent curto, instruções de agente verificáveis e artefatos machine-readable (tokens, OpenAPI, ADRs em Markdown). Para protótipo, cinco artefatos bastam; o resto escala com blast radius (multi-time, PII, API pública, qualidade de modelo). A bifurcação 2024–2026 é a regra de ouro: **docs humanos mais curtos**, **contratos para máquina mais precisos** — e qualquer ambiguidade na spec vira feature inventada no código.
