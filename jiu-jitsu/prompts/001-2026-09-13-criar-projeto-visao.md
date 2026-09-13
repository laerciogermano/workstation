# 001 — Criar projeto jiu-jitsu e documento de visão

| Campo | Valor |
|-------|--------|
| Número | 001 |
| Data | 2026-09-13 |
| Origem | Chat no Cursor (workstation) |
| Título | Criar projeto jiu-jitsu e documento de visão |

## Prompt original

```
Crie projeto ... de jiu-jitsu, chamado jiu-jitsu. Que nesse projeto existe grafo com todas as possibilidades de movimentação a partir de estado? Você tem todas as possibilidades de próximos movimentos? Crie primeiramente documento de visão conforme, segue o padrão dos outros projetos.
```

## Interpretação

Criar, no workstation, a pasta/projeto **jiu-jitsu** no padrão dos demais (visão, docs, config IA, timeline de prompts). O núcleo do produto é um **grafo**: a partir de um **estado**, listar as **possibilidades de próximo movimento**. Responder com honestidade que não existe catálogo universal completo a priori — o produto trabalha com catálogo curado e cobertura explícita. Nesta etapa, entregar **primeiro** o documento de visão; não avançar ainda a funcionalidades/BDD/código.

## O que foi feito

- Pasta `jiu-jitsu/` no workstation, no padrão dos outros projetos.
- Visão em `jiu-jitsu/README.md` (grafo de estados, próximos movimentos, completude honesta do catálogo).
- Índice da esteira em `jiu-jitsu/docs/README.md`.
- Timeline em `jiu-jitsu/prompts/` (este arquivo + `timeline.md`).
- Regras da IA em `jiu-jitsu/config/config-ia.md`.
- Entrada do projeto no `README.md` da raiz do workstation.
