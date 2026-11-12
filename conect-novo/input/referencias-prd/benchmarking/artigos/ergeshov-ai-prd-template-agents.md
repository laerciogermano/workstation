# The AI PRD Template Agents Actually Use

Fonte: https://ergeshov.com/writing/ai-prd-template-coding-agents  
Autor: Nurlan Ergeshov · 27 Apr 2026  
Uso: template “machine-readable” para Cursor / Lovable / Claude Code / Replit — contraste com PRD narrativo clássico.

## Tese

PRDs humanos deixam lacunas de contexto; agentes precisam de I/O determinístico, schemas, edge cases, non-goals e testes — não narrativa.

## Template (spec.md)

1. **Title / One-liner / Scope / Environments**
2. **User Story** — Who, Job, Trigger, Outcome, Success Metric (1 métrica logável)
3. **Flows** — Happy path numerado; alternates; APIs/interfaces (HTTP schema, props, events)
4. **Data Model** — Entities + sample JSON + permissions
5. **Edge Cases** — caso → comportamento esperado
6. **Acceptance Criteria** — Given/When/Then atômicos
7. **Non-Goals**
8. **Design Constraints** — UI, P95, security, models, infra
9. **Test Cases** — unit / integration / E2E / fixtures / telemetry
10. **Rollout** — flags, migration, owners

**Agent instruction (1 linha):**  
*Read this spec and implement only Acceptance Criteria using the Data Model and Flows. Generate tests first using Test Cases. Ask for missing constraints before coding.*

## Prompts por ferramenta

| Tool | Como alimentar |
|------|----------------|
| Cursor | `/spec.md` + “Follow /spec.md. Implement only AC…” |
| Lovable | Project Brief; Non-Goals no topo |
| Claude Code | “Read spec.md, summarize AC, confirm Edge Cases, propose file changes, then implement.” |
| Replit | `/docs/spec.md` + “Implement per AC. Log events… Use only libraries under Design Constraints.” |

## Failure modes

Vague flows → inventa UI/API · Sem data shapes → glue quebra · Missing non-goals → scope creep · Sem P95 → lento · Edge cases vagos → prod frágil · Testes depois → regressão.
