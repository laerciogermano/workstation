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

Cada US é um **recorte de funcionalidade** (Como… quero… para…) com cenários — não só tarefa técnica.

## Hierarquia

```text
EP-01 Capture — “Captura de tela do device”
├── US-01 Capturar tela via ADB
├── US-02 Validar captura no redroid
├── US-03 Capturar tela via agent
└── US-04 Escolher backend de captura

EP-02 Perceive — “Percepção frame → lista de elementos”
├── US-01 Validar schema de elemento
├── US-02 Extrair textos da tela (OCR)
├── US-03 Detectar controles visuais
├── US-04 Unificar lista de elementos
└── US-05 Inspecionar percepção via CLI

EP-03 Decide — “Decisão + orquestração de goals”
├── US-01 Selecionar elemento da lista
├── US-02 Decidir ação via LLM
├── US-03 Executar goal sem coordenadas fixas
├── US-04 Aguardar elemento aparecer
└── US-05 Registrar métricas por etapa

EP-04 Actuate — “Atuação no device”
├── US-01 Definir contrato de atuação
├── US-02 Executar gestos via ADB
├── US-03 Validar clique a partir do frame
├── US-04 Rolar lista até achar alvo
├── US-05 Calibrar resolução frame ↔ actuator
├── US-06 Executar gestos via agent
└── US-07 Escolher backend de atuação
```

→ [`../README.md`](../README.md) · [`../docs/`](../docs/README.md) · [`tasks`](../../../core/tasks/README.md#p1--connectmax--screen-robot) · [`board`](../../../core/board/README.md#p1--connectmax--screen-robot)
