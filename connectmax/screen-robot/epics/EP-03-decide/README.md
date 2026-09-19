# EP-03 — Decide

| Campo | Valor |
|-------|--------|
| ID | EP-03 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

A partir de `Element[]` + goal/step, produzir **`Action`** tipada (tap, swipe, type, copy, …) sem coordenadas hardcoded no goal — matcher determinístico e/ou LLM.

## Funcionalidades maiores

- **Decisão elementos + goal → ação**
- **Orquestração de goals** (runner, wait, métricas)

Recortadas nas histórias abaixo.

## Histórias

| ID | História | Esforço IA | Pasta |
|----|----------|------------|-------|
| US-01 | Selecionar elemento da lista | 36m | [`US-01-selecionar-elemento-da-lista/`](US-01-selecionar-elemento-da-lista/README.md) |
| US-02 | Decidir ação via LLM | 48m | [`US-02-decidir-acao-via-llm/`](US-02-decidir-acao-via-llm/README.md) |
| US-03 | Executar goal sem coordenadas fixas | 72m | [`US-03-executar-goal-sem-coordenadas/`](US-03-executar-goal-sem-coordenadas/README.md) |
| US-04 | Aguardar elemento aparecer | 30m | [`US-04-aguardar-elemento-aparecer/`](US-04-aguardar-elemento-aparecer/README.md) |
| US-05 | Registrar métricas por etapa | 24m | [`US-05-registrar-metricas-por-etapa/`](US-05-registrar-metricas-por-etapa/README.md) |

## Critério de pronto

- Goal JSON clica/age sem coords fixas.
- Wait cobre ausência temporária de elemento.

## Dependências

- Requer: [EP-02 Perceive](../EP-02-perceive/README.md)
- Consome: [EP-04 Actuate](../EP-04-actuate/README.md) para executar a `Action`
