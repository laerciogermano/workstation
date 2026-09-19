# US-02 — Decidir ação via LLM

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-03 Decide](../README.md) |
| Status | Todo |
| Esforço IA | 48m |
| Recorte de | Decisão elementos + goal → ação |
| Paralelo com | [US-01](../US-01-selecionar-elemento-da-lista/README.md) |

## História

Como agente do screen-robot, quero **decidir a ação via LLM** a partir do goal em linguagem e da lista de elementos, para goals flexíveis quando o matcher determinístico não basta.

## Cenários

### SC-01 — Escolhe elementId

Dado `Element[]` e intent "clicar em Seguir", quando **LLM Decide roda**, então a Action referencia um **elementId** existente.

### SC-02 — Tipo de ação válido

Quando a LLM **responde**, então `Action.type` é um dos tipos suportados (`tap`, `swipe`, `type`, `copy_text`, …).

### SC-03 — Fallback / desligado

Quando LLM está **desabilitada**, então o runner usa só o **matcher** (US-01).
