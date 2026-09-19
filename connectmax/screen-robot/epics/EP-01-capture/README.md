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

| ID | História | Descrição | Por quê | Esforço IA | Pasta |
|----|----------|-----------|---------|------------|-------|
| US-01 | Capturar tela via ADB | Capturar a tela no redroid/emulador via ADB e devolver Frame padronizado (PNG + width/height/ts) | Sem frame do device o robô não enxerga a tela; ADB é o caminho no redroid/emulador | 42m | [`US-01-capturar-tela-via-adb/`](US-01-capturar-tela-via-adb/README.md) |
| US-02 | Capturar tela via agent | Capturar a tela por agent no hardware com o mesmo Frame da US-01 | No hardware o screencap ADB pode não bastar; o agent mantém o mesmo contrato | 90m | [`US-02-capturar-tela-via-agent/`](US-02-capturar-tela-via-agent/README.md) |
| US-03 | Escolher backend de captura | Selecionar `adb` ou `agent` por config/factory | Trocar redroid ↔ hardware sem reescrever Perceive/Decide | 24m | [`US-03-escolher-backend-de-captura/`](US-03-escolher-backend-de-captura/README.md) |

## Critério de pronto

- `getFrame()` devolve PNG válido com dimensões.
- Troca ADB ↔ agent sem alterar Perceive/Decide.

## Dependências

- Desbloqueia: [EP-02 Perceive](../EP-02-perceive/README.md)
- Paralelo com: [EP-04 Actuate](../EP-04-actuate/README.md) (smoke conjunto)
