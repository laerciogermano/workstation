# TSK-005 — Gantt

| Campo | Valor |
|-------|--------|
| ID | TSK-005 |
| Status | Doing |
| Pai | [TSK-002](../README.md) |
| Output | [EP-03 — Gantt](../../../../epics/EP-03-gantt/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T005[TSK-005 Gantt]
  T021[TSK-021 Criar tarefa]
  T022[TSK-022 Mover tarefa]
  T023[TSK-023 Remover tarefa]
  T024[TSK-024 Atribuir responsavel]
  T027[TSK-027 Visualizar tarefas]
  T070[TSK-070 Selecionar atividade]
  T005 --> T021
  T005 --> T022
  T005 --> T023
  T005 --> T024
  T005 --> T027
  T005 --> T070
  style T005 fill:#fff3cd
  style T021 fill:#fff3cd
  style T022 fill:#fff3cd
  style T023 fill:#fff3cd
  style T024 fill:#fff3cd
  style T027 fill:#fff3cd
  style T070 fill:#fff3cd
```

## Filhos

- [`TSK-021`](TSK-021-criar-tarefa/README.md) → Output [US-01-criar-tarefa](../../../../epics/EP-03-gantt/US-01-criar-tarefa/README.md)
  - [`TSK-056`](TSK-021-criar-tarefa/TSK-056-criar-bdd/README.md) → Criar BDD
  - [`TSK-057`](TSK-021-criar-tarefa/TSK-057-criar-paf/README.md) → Criar PAF
- [`TSK-022`](TSK-022-mover-tarefa-dragdrop/README.md) → Output [US-02-mover-tarefa-dragdrop](../../../../epics/EP-03-gantt/US-02-mover-tarefa-dragdrop/README.md)
  - [`TSK-058`](TSK-022-mover-tarefa-dragdrop/TSK-058-criar-bdd/README.md) → Criar BDD
  - [`TSK-059`](TSK-022-mover-tarefa-dragdrop/TSK-059-criar-paf/README.md) → Criar PAF
- [`TSK-023`](TSK-023-remover-tarefa/README.md) → Output [US-03-remover-tarefa](../../../../epics/EP-03-gantt/US-03-remover-tarefa/README.md)
  - [`TSK-060`](TSK-023-remover-tarefa/TSK-060-criar-bdd/README.md) → Criar BDD
  - [`TSK-061`](TSK-023-remover-tarefa/TSK-061-criar-paf/README.md) → Criar PAF
- [`TSK-024`](TSK-024-atribuir-responsavel/README.md) → Output [US-04-atribuir-responsavel](../../../../epics/EP-03-gantt/US-04-atribuir-responsavel/README.md)
  - [`TSK-062`](TSK-024-atribuir-responsavel/TSK-062-criar-bdd/README.md) → Criar BDD
  - [`TSK-063`](TSK-024-atribuir-responsavel/TSK-063-criar-paf/README.md) → Criar PAF
- [`TSK-027`](TSK-027-visualizar-tarefas/README.md) → Output [US-07-visualizar-tarefas](../../../../epics/EP-03-gantt/US-07-visualizar-tarefas/README.md)
  - [`TSK-068`](TSK-027-visualizar-tarefas/TSK-068-criar-bdd/README.md) → Criar BDD
  - [`TSK-069`](TSK-027-visualizar-tarefas/TSK-069-criar-paf/README.md) → Criar PAF
- [`TSK-070`](TSK-070-selecionar-atividade/README.md) → Output [US-08-selecionar-atividade](../../../../epics/EP-03-gantt/US-08-selecionar-atividade/README.md)
  - [`TSK-071`](TSK-070-selecionar-atividade/TSK-071-criar-bdd/README.md) → Criar BDD
  - [`TSK-072`](TSK-070-selecionar-atividade/TSK-072-criar-paf/README.md) → Criar PAF
