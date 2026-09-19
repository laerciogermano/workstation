# US-01 — Definir contrato de atuação

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-04 Actuate](../README.md) |
| Status | Todo |
| Esforço IA | 12m |
| Recorte de | Atuação no device |

## História

Como agente do screen-robot, quero **um contrato único `Actuate.run(Action)`**, para executar tap/swipe/type/… sem o Decide conhecer ADB ou agent.

## Cenários

### SC-01 — Action tipada

Quando Decide **produz Action**, então Actuate **aceita** types suportados (`tap`, `swipe`, `type`, …).

### SC-02 — Sem vazamento de backend

Quando o consumidor **chama só Actuate**, então **não precisa** importar detalhes ADB.
