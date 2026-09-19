# US-02 — Validar captura no redroid

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-01 Capture](../README.md) |
| Status | Todo |
| Esforço IA | 9m |
| Recorte de | Captura de tela do device |
| Depende de | [US-01](../US-01-capturar-tela-via-adb/README.md) |

## História

Como desenvolvedor do screen-robot, quero **validar a captura com um smoke no redroid**, para garantir que o pipeline consegue um frame real antes de Perceive.

## Cenários

### SC-01 — Smoke gera PNG

Dado redroid em `127.0.0.1:5555` online, quando **rodo o smoke de captura**, então um **arquivo PNG** é gerado com width/height > 0.

### SC-02 — Pronto para Actuate

Quando o smoke **termina com sucesso**, então o frame **pode ser usado** no smoke conjunto frame → tap (EP-04).
