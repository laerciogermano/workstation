# TSK-022 — Mover tarefa

| Campo | Valor |
|-------|--------|
| ID | TSK-022 |
| Status | Done |
| Pai | [TSK-005](../README.md) |
| Output | [US-02 — Mover tarefa (drag and drop)](../../../../../epics/EP-03-gantt/US-02-mover-tarefa-dragdrop/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T022[TSK-022 Mover tarefa]
  T058[TSK-058 Criar BDD]
  T059[TSK-059 Criar PAF]
  T022 --> T058
  T022 --> T059
  style T022 fill:#d4edda
  style T058 fill:#d4edda
```

## Filhos

- [`TSK-058`](TSK-058-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-059`](TSK-059-criar-paf/README.md) → Criar PAF (Todo)
