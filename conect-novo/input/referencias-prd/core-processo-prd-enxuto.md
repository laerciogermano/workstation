## 1. Criar o PRD (requisitos)

**Por quê:** ancora a geração. Sem isso, benchmarking e prompts viram opinião solta.

**O que escrever (mínimo)**

| Campo | Pergunta que responde |
|-------|------------------------|
| **Contexto** | Onde isso vive? Para quem? Restrições (prazo, stack, marca, canal)? |
| **Dor** | Qual problema concreto dói hoje? Evidência (fato, citação, métrica)? |
| **Objetivo** | O que muda se der certo? (1–3 frases, observável) |
| **DoD** | Como saber que está pronto? Critérios testáveis / checklist de aceite |
| **Fora de escopo** | O que **não** entra nesta rodada |

**Como**

1. Pedir à IA: *“Escreve um PRD enxuto com Contexto, Dor, Objetivo, DoD e Fora de escopo — sem inventar solução.”*
2. Revisar: cortar solução prematura; deixar só problema e critérios.
3. Salvar em `docs/prd.md` (ou equivalente no projeto).

**Pronto quando:** alguém de fora entende o *porquê* e o *feito* sem ver nenhuma opção de design/código.

Modelo curto:

```markdown
# PRD — <nome>

## Contexto
…

## Dor
…

## Objetivo
…

## Definition of Done
- [ ] …
- [ ] …

## Fora de escopo
- …
```

---

