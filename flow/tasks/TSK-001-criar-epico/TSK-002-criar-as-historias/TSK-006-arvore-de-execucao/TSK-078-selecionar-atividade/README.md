# TSK-078 — Selecionar atividade

| Campo | Valor |
|-------|--------|
| ID | TSK-078 |
| Status | Doing |
| Pai | [TSK-006](../README.md) |
| Output | [US-06 — Selecionar atividade](../../../../../epics/EP-04-arvore-de-execucao/US-06-selecionar-atividade/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T078[TSK-078 Selecionar atividade]
  T089[TSK-089 Criar BDD]
  T090[TSK-090 Criar PAF]
  T078 --> T089
  T078 --> T090
  style T078 fill:#fff3cd
  style T089 fill:#d4edda
```

## Filhos

- [`TSK-089`](TSK-089-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-090`](TSK-090-criar-paf/README.md) → Criar PAF (Todo)
