# Referências PRD — insumos para contexto de IA

Pasta com skills, templates e artigos de mercado sobre como escrever PRD bem. Preferir **Markdown / `.txt`**; `raw-html/` é backup bruto.

## Como a IA deve usar

1. Ler `research-local-prd-produto.md` (síntese consolidada)
2. Escolher template por tipo: Lean / Google / Amazon PR-FAQ / Comprehensive
3. Seguir processo de skill (perguntas → draft → assumptions/risks)
4. Validar com `ai-pm-copilot-templates/prd-review-checklist.md`

## Skills (prompts para agentes)

| Arquivo | Origem |
|---------|--------|
| `lenny-writing-prds-SKILL.md` + `lenny-writing-prds-artifacts.md` + `lenny-writing-prds-guest-insights.md` | [RefoundAI/lenny-skills](https://github.com/RefoundAI/lenny-skills) |
| `wiveu-prd-skill-SKILL.md` + `wiveu-prd-skill-README.md` + `wiveu-references/` | [wiveu/prd-skill-agent](https://github.com/wiveu/prd-skill-agent) |
| `ralph-prd-SKILL.md` | [snarktank/ralph](https://github.com/snarktank/ralph) (PRD Writer) |
| `prd-creator-SKILL.cursor.md` | [goodai-base](https://github.com/MrCipherSmith/goodai-base) |
| `ai-pm-copilot-prd-templates-SKILL.md` | [slgoodrich/agents ai-pm-copilot](https://github.com/slgoodrich/agents) |
| `texto-extraido/skillsplayground-prd-writer.md` | [skillsplayground PRD Writer](https://skillsplayground.com/skills/prd-writer/) |

## Templates de mercado

| Arquivo | Estilo |
|---------|--------|
| `ai-pm-copilot-templates/lean-prd-template.md` | Feature pequena / 1 página |
| `ai-pm-copilot-templates/google-prd-template.md` | Objectives, non-goals, metrics, P0/P1/P2 |
| `ai-pm-copilot-templates/amazon-pr-faq-template.md` | Working Backwards (PR + FAQ) |
| `ai-pm-copilot-templates/comprehensive-prd-template.md` | PRD completo |
| `ai-pm-copilot-templates/prd-review-checklist.md` | Checklist de revisão |
| `wiveu-references/prd-template.md` | Template do skill interview-driven |
| `google-prd-template.md` | Cópia na raiz (mesmo Google) |
| `core-processo-prd-enxuto.md` | Padrão local works: Contexto / Dor / Objetivo / DoD / Fora de escopo |

## Autoridade / teoria

| Arquivo | Origem |
|---------|--------|
| `svpg-how-to-write-a-good-prd.pdf` + `.txt` | Marty Cagan / SVPG — [PDF](https://www.svpg.com/wp-content/uploads/2024/07/How-To-Write-a-Good-PRD.pdf) |
| `texto-extraido/svpg-discovery-vs-documentation.md` | [SVPG Discovery vs Documentation](https://www.svpg.com/discovery-vs-documentation/) |
| `research-local-prd-produto.md` | Síntese local 2024–2026 (Linear, Lenny, Amazon, Atlassian, etc.) |

## Artigos (texto extraído)

Em `texto-extraido/`:

- Atlassian PRD template
- Lenny Confluence product requirements
- Productboard PRD guide
- Product School PRD template
- Notion mastering PRD
- Amplitude product docs
- Figma how to create PRD
- ResetDocs PRD best practices
- Product Compass AI PRD template
- Adaline AI PRD missing sections
- Amazon Working Backwards
- Product Consortium “PRD is dead” (one-pager)

HTML bruto correspondente em `raw-html/`.

## Benchmarking extra (skills / prompts / rubricas)

Em `benchmarking/`:

- Skills: ChatPRD (`write-prd`, `check-prd-alignment`, `implement-from-prd`), alamops/mattpocock `to-prd`, clairem0, pillip, etc.
- Prompts: snarktank create-prd, flight505 gist
- Rubricas: ChatPRD review, kanevry reviewer

## Consenso de seções (padrão de mercado)

1. Problem statement (sem solução)
2. Evidence / why now
3. Audience
4. Goals + **non-goals**
5. Success metrics (baseline → target)
6. Assumptions / risks / open questions
7. Scope in/out + prioridade (P0 / MoSCoW)
8. Scenarios / stories / flows
9. Requirements testáveis + acceptance criteria
10. Dependencies / constraints / NFRs (e AI evals se couber)
