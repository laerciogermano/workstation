# EP-03 — Decide

| Campo | Valor |
|-------|--------|
| ID | EP-03 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

A partir de `Element[]` + goal/step, produzir **`Action`** tipada (tap, swipe, type, copy, …) sem coordenadas hardcoded no goal — matcher determinístico e/ou LLM.

## Histórias

| ID | História | Esforço IA | Notas |
|----|----------|------------|-------|
| US-01 | Matcher por label / kind / índice | 36m | Paralelo a US-02 |
| US-02 | Decide via LLM (opcional) | 48m | Goal em linguagem natural |
| US-03 | Steps + runner + goal example E2E | 72m | perceive → choose → act |
| US-04 | Wait/retry até elemento aparecer | 30m | Poll + timeout |
| US-05 | Métricas (acerto, latency, custo) | 24m | Por etapa |

## Critério de pronto

- Goal JSON clica/age sem coords fixas.
- Wait cobre ausência temporária de elemento.

## Dependências

- Requer: [EP-02 Perceive](../EP-02-perceive/README.md)
- Consome: [EP-04 Actuate](../EP-04-actuate/README.md) para executar a `Action`
