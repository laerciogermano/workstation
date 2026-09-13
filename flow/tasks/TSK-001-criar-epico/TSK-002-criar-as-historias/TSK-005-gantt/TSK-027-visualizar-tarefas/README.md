# TSK-027 — Visualizar tarefas

| Campo | Valor |
|-------|--------|
| ID | TSK-027 |
| Status | Done |
| Pai | [TSK-005](../README.md) |
| Output | [US-07 — Visualizar tarefas](../../../../../epics/EP-03-gantt/US-07-visualizar-tarefas/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T027[TSK-027 Visualizar tarefas]
  T068[TSK-068 Criar BDD]
  T069[TSK-069 Criar PAF]
  T027 --> T068
  T027 --> T069
  style T027 fill:#d4edda
  style T068 fill:#d4edda
```

## Filhos

- [`TSK-068`](TSK-068-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-069`](TSK-069-criar-paf/README.md) → Criar PAF (Todo)
