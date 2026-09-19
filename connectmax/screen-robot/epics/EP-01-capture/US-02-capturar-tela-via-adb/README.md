# US-02 — Capturar tela via ADB

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-01 Capture](../README.md) |
| Status | Todo |
| Esforço IA | 30m |
| Recorte de | Captura de tela do device |
| Depende de | [US-01](../US-01-obter-frame-padronizado/README.md) |

## História

Como agente do screen-robot, quero **capturar a tela do device via ADB** (screencap), para obter frames no redroid/emulador sem instalar agent.

## Cenários

### SC-01 — Screencap bem-sucedido

Dado um device ADB online, quando **executo AdbCapture.getFrame()**, então o sistema **grava/devolve um PNG** válido da tela atual.

### SC-02 — Serial configurável

Quando informo o **serial** (ex.: `127.0.0.1:5555`), então a captura **usa esse device** e não outro conectado.

### SC-03 — Falha explícita

Dado device offline, quando **tento capturar**, então o sistema **falha com erro claro** (não devolve frame vazio silencioso).
