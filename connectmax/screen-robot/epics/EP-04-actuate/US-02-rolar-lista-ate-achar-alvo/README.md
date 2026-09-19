# US-02 — Rolar lista até achar alvo

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-04 Actuate](../README.md) |
| Status | Todo |
| Esforço IA | 36m |
| Recorte de | Atuação no device · Orquestração de listas |
| Depende de | [US-01](../US-01-executar-gestos-via-agent/README.md) |

## História

Como agente do screen-robot, quero **rolar a tela e re-perceber até achar um alvo**, para interagir com itens fora da viewport inicial.

## Cenários

### SC-01 — Swipe + perceive

Dado alvo ausente no primeiro frame, quando **scroll_until** roda, então ao menos um **swipe via agent** ocorre e perceive é chamado de novo.

### SC-02 — Encontrou

Quando o alvo **aparece** após scroll, então o step **sucesso**.

### SC-03 — Max swipes

Quando o alvo **não aparece** após max_swipes, então o step **falha** de forma explícita.
