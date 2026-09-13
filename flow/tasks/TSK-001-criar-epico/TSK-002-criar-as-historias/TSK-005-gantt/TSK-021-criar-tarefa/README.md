# TSK-021 — Criar tarefa

| Campo | Valor |
|-------|--------|
| ID | TSK-021 |
| Status | Done |
| Pai | [TSK-005](../README.md) |
| Output | [US-01 — Criar tarefa](../../../../../epics/EP-03-gantt/US-01-criar-tarefa/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T021[TSK-021 Criar tarefa]
  T056[TSK-056 Criar BDD]
  T057[TSK-057 Criar PAF]
  T021 --> T056
  T021 --> T057
  style T021 fill:#d4edda
  style T056 fill:#d4edda
```

## Filhos

- [`TSK-056`](TSK-056-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-057`](TSK-057-criar-paf/README.md) → Criar PAF (Todo)
