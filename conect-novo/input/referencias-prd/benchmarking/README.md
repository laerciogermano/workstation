# Insumos para benchmarking de PRD (skills / prompts)

Corpus baixado da internet para comparar skills, prompts e rubricas de geração/avaliação de PRD — complementar a [`../`](../) (referências já coletadas).

**Insumo de negócio do teste:** [`../../insumo-prd.txt`](../../insumo-prd.txt) (Black Friday Conectmax).

## Como usar no benchmarking

1. Fixar o **mesmo input** (`insumo-prd.txt` + PRD enxuto de [`../core-processo-prd-enxuto.md`](../core-processo-prd-enxuto.md)).
2. Rodar cada **skill/prompt** de `skills/` e `prompts/` (e os já em `../`).
3. Avaliar outputs com **as mesmas rubricas** em `rubricas/`.
4. Usar `artigos/` como referência de método (experimentos já publicados).

## Inventário

### Skills (`skills/`)

| Arquivo | Origem | Papel no bench |
|---------|--------|----------------|
| `alamops-to-prd-SKILL.md` | [alamops/skills](https://github.com/alamops/skills) | PRD CPO-style com perguntas + reverse-eng de repo |
| `clairem0-prd-SKILL.md` | [clairem0/technically-curious-skills](https://github.com/clairem0/technically-curious-skills) | Contrato enxuto grounded em evidência do repo |
| `pillip-prd-SKILL.md` | [pillip/claude-dev-kit](https://github.com/pillip/claude-dev-kit) | PRD conversacional create/update |
| `mattpocock-to-prd-SKILL.md` | [mattpocock/skills](https://github.com/mattpocock/skills) via agentic-awesome | Síntese da conversa → PRD + issue tracker (sem interview) |
| `snarktank-ralph-prd-SKILL.md` | [snarktank/ralph](https://github.com/snarktank/ralph) | Q&A 3–5 + PRD implementável |
| `chatprd-write-prd-SKILL.md` | [ChatPRD/cursor-plugin](https://github.com/ChatPRD/cursor-plugin) | PRD a partir do codebase |
| `chatprd-implement-from-prd-SKILL.md` | idem | Downstream: plano a partir do PRD |
| `chatprd-check-prd-alignment-SKILL.md` | idem | Downstream: coverage vs código |

Já no parent (não duplicados aqui): `wiveu-prd-skill`, `ralph-prd`, `lenny-writing-prds`, `prd-creator-SKILL.cursor`, `ai-pm-copilot-prd-templates`.

### Prompts / rules Cursor (`prompts/`)

| Arquivo | Origem |
|---------|--------|
| `snarktank-create-prd.md` | [snarktank/ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks) — base do teste PromptToProduct/Cursor |
| `snarktank-generate-tasks.md` | idem (pós-PRD → tasks) |
| `flight505-prd-prompts-gist.md` | [gist](https://gist.github.com/flight505/4857ab3a8bd02b0a6b18a6ff995399cb) meta-PRD + outline forçado |
| `jesse-spevack-create-prd.mdc` | variante create_prd |
| `kovyrin-create-prd.mdc` | variante create_prd |
| `markhazlett-create-prd.mdc` | variante create_prd |
| `pepeladeira-create-prd.mdc` | variante create_prd (PT README / rule EN) |

### Rubricas (`rubricas/`)

| Arquivo | Dimensões |
|---------|-----------|
| `prompttoproduct-prd-eval-7criterios.md` | Clarity, User, Differentiation, Risk, Goals, Strategy, Usability (1–5, /35) |
| `chatprd-review-doc-SKILL.md` | Strategy (peso alto), Structure, Clarity, Completeness (1–10) + edits citáveis |
| `kanevry-prd-reviewer-prompt.md` | Completeness, Consistency, Clarity, Scope, YAGNI, SMART, User Stories (PASS/FAIL) |

### Artigos de experimento (`artigos/`)

| Arquivo | O que traz |
|---------|------------|
| `prompttoproduct-3-methods-prd-benchmark.md` | Claude > Cursor > ChatPRD no caso testado + rubrica |
| `brick-institute-4-ais-prd-benchmark.md` | Prompt compartilhado; ChatGPT/Gemini/Claude/Cursor |
| `ergeshov-ai-prd-template-agents.md` | Template agent-first (spec.md) |
| `tinyprd-prds-por-ferramenta.md` | PRD adapta por ferramenta |

## Dimensões sugeridas para o nosso scorecard

Além das rubricas prontas, comparar skills/prompts em:

- **Descoberta:** entrevista vs síntese vs one-shot
- **Problema-first vs solução-first** (alinhado ao PRD enxuto)
- **Acionabilidade para eng** (AC testáveis, schemas)
- **Adequação a campanha/negócio** (não só feature de software) — gap: a maioria dos skills assume feature de produto digital
- **Comprimento / ruído**
- **Non-goals e métricas SMART**

## Fontes (URLs)

- https://prompttoproduct.substack.com/p/writing-prds-in-the-age-of-ai-i-tested
- https://www.brick.institute/blog/dort-zeka-bir-prd-farkli-yapay-zeka-araclari-ile-prd-deneyleri
- https://ergeshov.com/writing/ai-prd-template-coding-agents
- https://www.tinyprd.app/blog/prds-for-lovable-cursor-claude-code
- https://github.com/ChatPRD/cursor-plugin
- https://github.com/alamops/skills
- https://github.com/snarktank/ralph
- https://github.com/snarktank/ai-dev-tasks
- https://github.com/mattpocock/skills
- https://github.com/kanevry/session-orchestrator
