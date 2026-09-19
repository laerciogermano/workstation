# EP-01 — Capture

| Campo | Valor |
|-------|--------|
| ID | EP-01 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

Obter o **frame** atual da tela (PNG + `width`/`height`/`ts`) via interface `Capture`, com backends plugáveis (ADB hoje; agent depois).

## Histórias

| ID | História | Esforço IA | Notas |
|----|----------|------------|-------|
| US-01 | Contratos `Capture.getFrame()` | 12m | Parte dos contratos F0 |
| US-02 | AdbCapture (screencap → frame) | 30m | Backend ADB |
| US-03 | Smoke: obter frame no redroid | 9m | Integra com Actuate no smoke E2E |
| US-04 | Capture agent (APK / scrcpy USB) | 90m | Hardware-ready |
| US-05 | Flag `backend=adb\|agent` (lado capture) | 24m | Factory sem mudar Perceive/Decide |

## Critério de pronto

- `getFrame()` devolve PNG válido com dimensões.
- Troca ADB ↔ agent sem alterar Perceive/Decide.

## Dependências

- Desbloqueia: [EP-02 Perceive](../EP-02-perceive/README.md)
- Paralelo com: [EP-04 Actuate](../EP-04-actuate/README.md) (smoke conjunto)
