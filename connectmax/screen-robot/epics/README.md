# screen-robot — Épicos

Pipeline do robô: **Capture → Perceive → Decide → Actuate**.

| ID | Épico | Pasta | Intenção |
|----|-------|-------|----------|
| EP-01 | Capture | [`EP-01-capture/`](EP-01-capture/README.md) | Frame da tela (PNG + width/height/ts) |
| EP-02 | Perceive | [`EP-02-perceive/`](EP-02-perceive/README.md) | Frame → `Element[]` (OCR + vision) |
| EP-03 | Decide | [`EP-03-decide/`](EP-03-decide/README.md) | Elementos + goal → `Action` |
| EP-04 | Actuate | [`EP-04-actuate/`](EP-04-actuate/README.md) | Executar ação no device |

## Fluxo

```text
EP-01 Capture  →  EP-02 Perceive  →  EP-03 Decide  →  EP-04 Actuate
```

Backends plugáveis (`adb` | `agent`) em Capture e Actuate; Perceive e Decide permanecem estáveis.

## Hierarquia

```text
EP-01 Capture
├── US-01 Contratos Capture
├── US-02 AdbCapture
├── US-03 Smoke frame
├── US-04 Capture agent
└── US-05 Flag backend (capture)

EP-02 Perceive
├── US-01 Schema Element
├── US-02 OCR
├── US-03 Vision
├── US-04 Merge
└── US-05 CLI + overlay

EP-03 Decide
├── US-01 Matcher
├── US-02 LLM Decide
├── US-03 Steps + goal E2E
├── US-04 Wait/retry
└── US-05 Métricas

EP-04 Actuate
├── US-01 Contratos Actuate
├── US-02 AdbActuate
├── US-03 Smoke tap
├── US-04 Scroll
├── US-05 Calibração
├── US-06 Actuate agent
└── US-07 Flag backend (actuate)
```

→ [`../README.md`](../README.md) · [`../docs/`](../docs/) · [`tasks`](../../../core/tasks/README.md#p1--connectmax--screen-robot) · [`board`](../../../core/board/README.md#p1--connectmax--screen-robot)
