# Writing PRDs in the Age of AI: I Tested 3 Methods So You Don't Have To

Fonte: https://prompttoproduct.substack.com/p/writing-prds-in-the-age-of-ai-i-tested  
Autor: Anna · 12 Aug 2025  
Uso: experimento de benchmarking Claude vs Cursor vs ChatPRD + rubrica 7 critérios.

## Experimento

Mesmo desafio de PRD, 3 abordagens, até 3 rounds de iteração:

| Método | Tipo | Score |
|--------|------|-------|
| Claude (free) | prompt estruturado conversacional | 32/35 (91%) |
| Cursor (free) | scaffolding markdown (ai-dev-tasks) | 30/35 (86%) |
| ChatPRD ($10/mo) | ferramenta dedicada | 27/35 (77%) |

Avaliação feita com a rubrica abaixo via Perplexity Pro.

## Limitações declaradas pelo autor

- Limite de 3 rounds pode prejudicar ChatPRD (UI feita para iteração longa)
- Viés de experiência do autor com Claude
- Caso B2C simples — enterprise/regulado pode mudar o ranking

## Prompt de estrutura (Claude)

```
## Claude PRD Structure

The generated PRD should include the following sections:

- **Introduction/Overview:** Briefly describe the feature and the problem it solves. State the goal.
- **Goals:** List the specific, measurable objectives for this feature.
- **User Stories:** Detail the user narratives describing feature usage and benefits.
- **Functional Requirements:** Numbered, clear, concise ("The system must…").
- **Non-Goals (Out of Scope):** What this feature will not include.
- **Design Considerations (Optional)**
- **Technical Considerations (Optional)**
- **Success Metrics**
- **Open Questions**
```

Cursor: usar https://github.com/snarktank/ai-dev-tasks (ver `prompts/snarktank-create-prd.md`).

## Rubrica de avaliação (PRD Eval) — 7 critérios × 1–5 = /35

```
##PRD Eval

##Role
You are evaluating the following written text using a provided rubric.

## Evaluation Instructions
1. Paste the PRD to be evaluated.
2. Skim for context: product, user problem, logical structure.
3. For each criterion: score 1–5 (or N/A + justification); Strength; Suggestion; Rationale.
4. Total out of 35 (7 × 5).
5. Top 5 prioritized recommendations.

## Evaluation Template

| Evaluation Criteria            | Score (1–5) | Notes / Rationale |
|--------------------------------|-------------|-------------------|
| 1. Clarity & Simplicity        |             | Core ideas clear? Purpose quick to grasp? |
| 2. User Understanding          |             | Deep understanding of target users/needs? |
| 3. Product Differentiation     |             | Unique vs alternatives? |
| 4. Risk Awareness              |             | Technical/user/market risks & assumptions? |
| 5. Goal Alignment              |             | Goals tied to real outcomes (not vanity)? |
| 6. Strategic Awareness         |             | Market, competition, long-term strategy? |
| 7. Functional Usability        |             | Actionable for design/eng/stakeholders? |

**Total Score (out of 35):** ____ / 35
```
