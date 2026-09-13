# 001 — Criar projeto flow language e documento de visão

| Campo | Valor |
|-------|--------|
| Número | 001 |
| Data | 2026-09-13 |
| Origem | Chat no Cursor (workstation) |
| Título | Criar projeto flow language e documento de visão |

## Prompt original

```
crie um projeto chamado flow language onde ele deve ser criado primeiro que o flow

ele é basicamente a parte do sistema que transforma uma linguagem em uma visualizacao flow e vice versa

uma visualizacao em tempo real do flow com entradas, saidas e etc
```

## Interpretação

Criar, no workstation, a pasta/projeto **flow-language** no padrão dos demais (visão, docs, config IA, timeline de prompts). Posicioná-lo como **pré-requisito do Flow** na ordem de desenvolvimento. O núcleo do produto é a **tradução bidirecional** entre linguagem e visualização Flow, com **sincronização em tempo real** (entradas, saídas, composição). Nesta etapa, entregar **primeiro** o documento de visão; não avançar ainda a funcionalidades/BDD/código.

## O que foi feito

- Pasta `flow-language/` no workstation, no padrão dos outros projetos.
- Visão em `flow-language/README.md` (linguagem ↔ visual, IR, tempo real, entradas/saídas).
- Índice da esteira em `flow-language/docs/README.md`.
- Timeline em `flow-language/prompts/` (este arquivo + `timeline.md`).
- Regras da IA em `flow-language/config/config-ia.md`.
- Entrada do projeto e ordem **Flow Language → Flow → Plans** no `README.md` da raiz do workstation.
- Nota de dependência no `flow/README.md`.
