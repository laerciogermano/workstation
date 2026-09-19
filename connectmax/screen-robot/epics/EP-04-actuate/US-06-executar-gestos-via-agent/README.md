# US-06 — Executar gestos via agent

| Campo | Valor |
|-------|--------|
| ID | US-06 |
| Épico | [EP-04 Actuate](../README.md) |
| Status | Todo |
| Esforço IA | 90m |
| Recorte de | Atuação no device |
| Depende de | [US-01](../US-01-definir-contrato-de-atuacao/README.md) |

## História

Como agente do screen-robot, quero **executar Actions via agent no hardware**, para o mesmo Decide funcionar sem ADB screencap/input clássico.

## Cenários

### SC-01 — Tap via agent

Quando Action tap **é enviada ao agent**, então o device **registra o toque** (ou mock confirma).

### SC-02 — Mesmo schema Action

Quando uso **AgentActuate**, então o Decide **não muda** o formato da Action.
