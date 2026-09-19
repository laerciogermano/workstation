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

| ID | História | Por quê | Esforço IA | Pasta |
|----|----------|---------|------------|-------|
| US-01 | Capturar tela via ADB | Sem frame do device o robô não enxerga a tela; ADB é o caminho no redroid/emulador | 42m | [`US-01-capturar-tela-via-adb/`](US-01-capturar-tela-via-adb/README.md) |
| US-02 | Validar captura no redroid | Evita avançar Perceive/Actuate com captura quebrada ou device offline | 9m | [`US-02-validar-captura-no-redroid/`](US-02-validar-captura-no-redroid/README.md) |
| US-03 | Capturar tela via agent | No hardware físico o screencap ADB pode não bastar; o agent mantém o mesmo Frame | 90m | [`US-03-capturar-tela-via-agent/`](US-03-capturar-tela-via-agent/README.md) |
| US-04 | Escolher backend de captura | Trocar redroid ↔ hardware sem reescrever Perceive/Decide | 24m | [`US-04-escolher-backend-de-captura/`](US-04-escolher-backend-de-captura/README.md) |

## Critério de pronto

- `getFrame()` devolve PNG válido com dimensões.
- Troca ADB ↔ agent sem alterar Perceive/Decide.

## Dependências

- Desbloqueia: [EP-02 Perceive](../EP-02-perceive/README.md)
- Paralelo com: [EP-04 Actuate](../EP-04-actuate/README.md) (smoke conjunto)
