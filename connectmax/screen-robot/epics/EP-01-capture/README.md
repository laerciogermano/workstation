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

| ID | História | Funcionalidade | Esforço IA | Pasta |
|----|----------|----------------|------------|-------|
| US-01 | Obter frame padronizado | Devolver o frame da tela em formato único (PNG + width/height/ts) via interface `Capture`, sem acoplar o consumidor ao backend | 12m | [`US-01-obter-frame-padronizado/`](US-01-obter-frame-padronizado/README.md) |
| US-02 | Capturar tela via ADB | Capturar a tela do redroid/emulador com screencap ADB e preencher o Frame padronizado | 30m | [`US-02-capturar-tela-via-adb/`](US-02-capturar-tela-via-adb/README.md) |
| US-03 | Validar captura no redroid | Smoke que comprova frame PNG real no device online antes de Perceive/Actuate | 9m | [`US-03-validar-captura-no-redroid/`](US-03-validar-captura-no-redroid/README.md) |
| US-04 | Capturar tela via agent | Capturar a tela por agent no hardware (mesmo contrato `getFrame()` da US-01) | 90m | [`US-04-capturar-tela-via-agent/`](US-04-capturar-tela-via-agent/README.md) |
| US-05 | Escolher backend de captura | Selecionar `adb` ou `agent` por config/factory sem alterar Perceive/Decide | 24m | [`US-05-escolher-backend-de-captura/`](US-05-escolher-backend-de-captura/README.md) |

## Critério de pronto

- `getFrame()` devolve PNG válido com dimensões.
- Troca ADB ↔ agent sem alterar Perceive/Decide.

## Dependências

- Desbloqueia: [EP-02 Perceive](../EP-02-perceive/README.md)
- Paralelo com: [EP-04 Actuate](../EP-04-actuate/README.md) (smoke conjunto)
