# US-05 — Registrar métricas por etapa

| Campo | Valor |
|-------|--------|
| ID | US-05 |
| Épico | [EP-03 Decide](../README.md) |
| Status | Todo |
| Esforço IA | 24m |
| Recorte de | Orquestração de goals |
| Depende de | [US-03](../US-03-executar-goal-sem-coordenadas/README.md) |

## História

Como operador do screen-robot, quero **registrar métricas por etapa** (acerto, latência, custo), para acompanhar qualidade e gasto do pipeline.

## Cenários

### SC-01 — Latency

Quando um step **termina**, então há registro de **duração** da etapa.

### SC-02 — Custo vision/LLM

Quando Perceive/Decide **usam API paga**, então o custo **é contabilizado** (ou marcado N/A se local).

### SC-03 — Acerto de clique

Quando um tap **é executado**, então a métrica pode registrar **sucesso/falha** observável do step.
