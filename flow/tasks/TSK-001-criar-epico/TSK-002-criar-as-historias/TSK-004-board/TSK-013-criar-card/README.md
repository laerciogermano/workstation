# TSK-013 — Criar card

| Campo | Valor |
|-------|--------|
| ID | TSK-013 |
| Status | Doing |
| Pai | [TSK-004](../README.md) |
| Output | [US-01 — Criar card](../../../../../epics/EP-02-board/US-01-criar-card/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T013[TSK-013 Criar card]
  T040[TSK-040 Criar BDD]
  T041[TSK-041 Criar PAF]
  T013 --> T040
  T013 --> T041
  style T013 fill:#fff3cd
  style T040 fill:#d4edda
```

## Filhos

- [`TSK-040`](TSK-040-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-041`](TSK-041-criar-paf/README.md) → Criar PAF (Todo)
