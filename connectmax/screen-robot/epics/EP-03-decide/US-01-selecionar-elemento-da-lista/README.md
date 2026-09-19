# US-01 — Selecionar elemento da lista

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-03 Decide](../README.md) |
| Status | Todo |
| Esforço IA | 36m |
| Recorte de | Decisão elementos + goal → ação |
| Paralelo com | [US-02](../US-02-decidir-acao-via-llm/README.md) |

## História

Como agente do screen-robot, quero **selecionar um elemento da lista por label, kind ou índice**, para produzir um alvo sem coordenadas fixas no goal.

## Cenários

### SC-01 — Por label

Dado elementos com label "Seguir", quando o step pede **label="Seguir"**, então Decide escolhe esse Element.

### SC-02 — Por kind e índice

Quando o step pede **kind="button" index=0**, então Decide escolhe o **primeiro** botão da lista.

### SC-03 — Não encontrado

Quando **nenhum** elemento casa, então Decide **falha** com erro explícito (não inventa tap).
