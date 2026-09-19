# EP-01 — Capture

| Campo | Valor |
|-------|--------|
| ID | EP-01 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

Obter o **frame** atual da tela (PNG + `width`/`height`/`ts`) via interface `Capture`, com backends plugáveis (ADB hoje; agent depois).

## Funcionalidade maior

**Captura de tela do device** — recortada nas histórias abaixo.

## Histórias

| ID | História | Esforço IA | Pasta |
|----|----------|------------|-------|
| US-01 | Obter frame padronizado | 12m | [`US-01-obter-frame-padronizado/`](US-01-obter-frame-padronizado/README.md) |
| US-02 | Capturar tela via ADB | 30m | [`US-02-capturar-tela-via-adb/`](US-02-capturar-tela-via-adb/README.md) |
| US-03 | Validar captura no redroid | 9m | [`US-03-validar-captura-no-redroid/`](US-03-validar-captura-no-redroid/README.md) |
| US-04 | Capturar tela via agent | 90m | [`US-04-capturar-tela-via-agent/`](US-04-capturar-tela-via-agent/README.md) |
| US-05 | Escolher backend de captura | 24m | [`US-05-escolher-backend-de-captura/`](US-05-escolher-backend-de-captura/README.md) |

## Critério de pronto

- `getFrame()` devolve PNG válido com dimensões.
- Troca ADB ↔ agent sem alterar Perceive/Decide.

## Dependências

- Desbloqueia: [EP-02 Perceive](../EP-02-perceive/README.md)
- Paralelo com: [EP-04 Actuate](../EP-04-actuate/README.md) (smoke conjunto)
