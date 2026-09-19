# US-01 — Capturar tela via agent

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-01 Capture](../README.md) |
| Status | Todo |
| Esforço IA | 90m |
| Recorte de | Captura de tela do device |

## História

Como agente do screen-robot, quero **capturar a tela via agent** e receber um **Frame padronizado** (PNG + width/height/ts), para que Perceive e Decide consumam a tela do device **somente por agent** (padrão atual do projeto).

## Cenários

### SC-01 — Agent devolve frame

Dado agent acessível no endpoint configurado, quando **chamo Capture.getFrame()**, então recebo **Frame** com PNG válido, `width`, `height` e `ts`.

### SC-02 — Dimensões coerentes

Quando o frame **é devolvido**, então `width` e `height` são **> 0** e coerentes com o PNG.

### SC-03 — Endpoint configurável

Quando defino o **endpoint/URL** do agent, então a captura **usa esse destino**.

### SC-04 — Falha explícita

Dado agent offline, quando **tento capturar**, então o sistema **falha com erro claro**.
