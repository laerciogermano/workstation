# US-01 — Capturar tela via ADB

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-01 Capture](../README.md) |
| Status | Todo |
| Esforço IA | 42m |
| Recorte de | Captura de tela do device |

## História

Como agente do screen-robot, quero **capturar a tela do device via ADB** e receber um **frame padronizado** (PNG + width/height/ts), para que Perceive e Decide consumam a tela do redroid/emulador sem conhecer detalhes do screencap.

## Cenários

### SC-01 — Screencap bem-sucedido

Dado um device ADB online, quando **executo a captura**, então o sistema **devolve um Frame** com PNG válido da tela atual.

### SC-02 — Formato padronizado

Quando o frame **é devolvido**, então inclui `width`, `height` e `ts`, com dimensões **> 0** e coerentes com o PNG.

### SC-03 — Serial configurável

Quando informo o **serial** (ex.: `127.0.0.1:5555`), então a captura **usa esse device** e não outro conectado.

### SC-04 — Falha explícita

Dado device offline, quando **tento capturar**, então o sistema **falha com erro claro** (não devolve frame vazio silencioso).

### SC-05 — Consumidor desacoplado

Quando Perceive/Decide **consomem só o Frame**, então **não precisam** conhecer comandos ADB.
