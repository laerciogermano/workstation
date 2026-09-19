# screen-robot — Épicos

Pipeline do robô: **Capture → Perceive → Decide → Actuate**.

| ID | Épico | Descrição | Por quê | Pasta |
|----|-------|-----------|---------|-------|
| EP-01 | Capture | Obter o frame da tela (PNG + width/height/ts) via `Capture`, com backends ADB ou agent | Sem frame o robô não enxerga a UI; backends plugáveis permitem redroid hoje e hardware depois | [`EP-01-capture/`](EP-01-capture/README.md) |
| EP-02 | Perceive | Transformar frame → `Element[]` (OCR + vision + merge + CLI) | Sem lista de elementos não há o que selecionar nem clicar com intenção | [`EP-02-perceive/`](EP-02-perceive/README.md) |
| EP-03 | Decide | A partir de elementos + goal, produzir `Action` (matcher e/ou LLM) e orquestrar o goal | Fecha o ciclo intenção → ação sem coordenadas hardcoded | [`EP-03-decide/`](EP-03-decide/README.md) |
| EP-04 | Actuate | Executar `Action` no device (tap/swipe/type/scroll), com calibração e backends ADB/agent | Sem executar o gesto no device a decisão não altera a tela | [`EP-04-actuate/`](EP-04-actuate/README.md) |

## Fluxo

```text
EP-01 Capture  →  EP-02 Perceive  →  EP-03 Decide  →  EP-04 Actuate
```

Backends plugáveis (`adb` | `agent`) em Capture e Actuate; Perceive e Decide permanecem estáveis.

Cada US é um **recorte de funcionalidade** (Como… quero… para…) com cenários — não só tarefa técnica. Detalhe (descrição + por quê) na tabela de histórias de cada épico.

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
