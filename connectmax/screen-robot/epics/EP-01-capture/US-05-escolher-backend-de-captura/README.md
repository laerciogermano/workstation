# US-05 — Escolher backend de captura

| Campo | Valor |
|-------|--------|
| ID | US-05 |
| Épico | [EP-01 Capture](../README.md) |
| Status | Todo |
| Esforço IA | 24m |
| Recorte de | Captura de tela do device |
| Depende de | [US-02](../US-02-capturar-tela-via-adb/README.md), [US-04](../US-04-capturar-tela-via-agent/README.md) |

## História

Como operador do screen-robot, quero **escolher o backend de captura** (`adb` ou `agent`) por configuração, para trocar o ambiente sem reescrever Perceive/Decide.

## Cenários

### SC-01 — Factory ADB

Dado `BACKEND=adb` (ou equivalente), quando a factory **monta Capture**, então a instância é **AdbCapture**.

### SC-02 — Factory agent

Dado `BACKEND=agent`, quando a factory **monta Capture**, então a instância é **AgentCapture**.

### SC-03 — Perceive inalterado

Quando **troco o backend**, então o restante do pipeline **não precisa mudar** código de Perceive/Decide.
