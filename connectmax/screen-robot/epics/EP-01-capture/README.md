# EP-01 — Capture

| Campo | Valor |
|-------|--------|
| ID | EP-01 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

Obter o **frame** atual da tela (PNG + `width`/`height`/`ts`) via interface `Capture` **por agent** (padrão único neste momento).

## Premissa

**Neste momento todos os devices são agents.** Não há US de ADB nem de troca de backend no Capture.

## Funcionalidade maior

**Captura de tela do device** — via agent.

## Histórias

| ID | História | Descrição | Por quê | Esforço IA | Pasta |
|----|----------|-----------|---------|------------|-------|
| US-01 | Capturar tela via agent | Capturar a tela pelo agent e devolver Frame padronizado (PNG + width/height/ts) | Sem frame o robô não enxerga a tela; agent é o único caminho de captura agora | 90m | [`US-01-capturar-tela-via-agent/`](US-01-capturar-tela-via-agent/README.md) |

## Critério de pronto

- `getFrame()` via agent devolve PNG válido com dimensões.

## Dependências

- Desbloqueia: [EP-02 Perceive](../EP-02-perceive/README.md)
- Paralelo com: [EP-04 Actuate](../EP-04-actuate/README.md)
