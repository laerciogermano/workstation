# US-01 — Executar gestos via agent

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-04 Actuate](../README.md) |
| Status | Todo |
| Esforço IA | 102m |
| Recorte de | Atuação no device |

## História

Como agente do screen-robot, quero **executar Actions (tap, swipe, type) via agent** com contrato `Actuate.run(Action)`, para o Decide manipular o device **somente por agent** (padrão atual do projeto).

## Cenários

### SC-01 — Action tipada

Quando Decide **produz Action**, então Actuate **aceita** types suportados (`tap`, `swipe`, `type`, …).

### SC-02 — Tap via agent

Quando Action tap **é enviada ao agent**, então o device **registra o toque**.

### SC-03 — Swipe / type

Quando Action é **swipe** ou **type**, então o agent **executa** o gesto correspondente.

### SC-04 — Decide desacoplado

Quando o consumidor **chama só Actuate**, então **não precisa** conhecer detalhes do agent além do endpoint configurado.
