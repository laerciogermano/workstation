# 001 — Criar projeto fitness e timeline de prompts

| Campo | Valor |
|-------|--------|
| Número | 001 |
| Data | 2026-09-04 |
| Origem | Chat no Cursor (workstation) |
| Título | Criar pasta do app fitness e timeline de prompts |

## Prompt original

```
adicione uma pasta para outro projeto que éum projeto fitness. Um app que reune tudo que uma pessoa precisa para acompanhar treino, dieta, metricas. Adicionar uma gamificacao como o strava

- adicionar informacoes para calculo basal
- adicionar secao de adicionar metricas e acomapnhar via dashboards e graficos a evolucao
- adicionar fotos para comparar via timeline
- montar dieta com base no que possuo disponivel
- montar dieta com base em macro nutrientes
- montar treinos diversos, desde musculacao ate outros, calistenia e etc
- ao montar os treinos cada exercicio conta as calorias
- adicinoar estrategia de deficit ou superavit calorico
```

## Interpretação

Criar, no workstation, uma pasta de projeto para um **app fitness** que une treino, dieta e métricas, com gamificação no estilo Strava. A visão deve cobrir: cálculo basal; métricas com dashboards/gráficos; fotos em timeline; dieta por estoque disponível e por macros; treinos multimodais (musculação, calistenia etc.) com calorias por exercício; estratégia de déficit ou superávit. Seguir o padrão dos outros projetos (visão, docs, config IA, timeline de prompts) e registrar este prompt.

## O que foi feito

- Pasta `fitness/` no workstation, no padrão dos outros projetos.
- Visão em `fitness/README.md`.
- Índice da esteira em `fitness/docs/README.md`.
- Timeline em `fitness/prompts/` (este arquivo + `timeline.md`).
- Regras da IA em `fitness/config/config-ia.md`, incluindo a obrigação de salvar cada prompt novo.
- Entrada do projeto no `README.md` da raiz do workstation.
