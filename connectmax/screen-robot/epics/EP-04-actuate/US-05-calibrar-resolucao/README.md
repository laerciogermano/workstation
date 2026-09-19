# US-05 — Calibrar resolução frame ↔ actuator

| Campo | Valor |
|-------|--------|
| ID | US-05 |
| Épico | [EP-04 Actuate](../README.md) |
| Status | Todo |
| Esforço IA | 30m |
| Recorte de | Atuação no device |
| Depende de | [US-01](../US-01-definir-contrato-de-atuacao/README.md) |

## História

Como agente do screen-robot, quero **mapear coordenadas do frame para o espaço do actuator**, para cliques corretos quando a captura e o device têm resoluções diferentes.

## Cenários

### SC-01 — Escala proporcional

Dado frame 1080×1920 e actuator 720×1280, quando calibro center **[540,960]**, então o tap enviado é **[360,640]** (±1px).

### SC-02 — Mesma resolução

Dado frame e actuator **iguais**, quando calibro, então as coordenadas **permanecem iguais**.
