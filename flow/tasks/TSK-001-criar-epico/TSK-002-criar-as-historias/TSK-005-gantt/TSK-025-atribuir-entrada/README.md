# TSK-025 — Atribuir entrada

| Campo | Valor |
|-------|--------|
| ID | TSK-025 |
| Status | Doing |
| Pai | [TSK-005](../README.md) |
| Output | [US-05 — Atribuir entrada](../../../../../epics/EP-03-gantt/US-05-atribuir-entrada/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T025[TSK-025 Atribuir entrada]
  T064[TSK-064 Criar BDD]
  T065[TSK-065 Criar PAF]
  T025 --> T064
  T025 --> T065
  style T025 fill:#fff3cd
  style T064 fill:#d4edda
```

## Filhos

- [`TSK-064`](TSK-064-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-065`](TSK-065-criar-paf/README.md) → Criar PAF (Todo)
