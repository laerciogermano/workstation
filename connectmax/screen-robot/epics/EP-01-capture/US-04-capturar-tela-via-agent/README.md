# US-04 — Capturar tela via agent

| Campo | Valor |
|-------|--------|
| ID | US-04 |
| Épico | [EP-01 Capture](../README.md) |
| Status | Todo |
| Esforço IA | 90m |
| Recorte de | Captura de tela do device |
| Depende de | [US-01](../US-01-obter-frame-padronizado/README.md) |

## História

Como agente do screen-robot, quero **capturar a tela via agent no device** (APK / endpoint), para o mesmo contrato `getFrame()` funcionar em hardware sem depender só de screencap ADB.

## Cenários

### SC-01 — Agent devolve frame

Dado agent acessível no endpoint configurado, quando **chamo AgentCapture.getFrame()**, então recebo **Frame** no mesmo schema da US-01.

### SC-02 — Compatível com Perceive

Quando o frame **vem do agent**, então Perceive **consome sem alteração** de código.

### SC-03 — Endpoint configurável

Quando defino o **endpoint/URL** do agent, então a captura **usa esse destino**.
