# TSK-026 — Atribuir saída

| Campo | Valor |
|-------|--------|
| ID | TSK-026 |
| Status | Done |
| Pai | [TSK-005](../README.md) |
| Output | [US-06 — Atribuir saída](../../../../../epics/EP-03-gantt/US-06-atribuir-saida/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T026[TSK-026 Atribuir saida]
  T066[TSK-066 Criar BDD]
  T067[TSK-067 Criar PAF]
  T026 --> T066
  T026 --> T067
  style T026 fill:#d4edda
  style T066 fill:#d4edda
```

## Filhos

- [`TSK-066`](TSK-066-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-067`](TSK-067-criar-paf/README.md) → Criar PAF (Todo)
