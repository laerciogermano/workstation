# TSK-001 — Criar épico

| Campo | Valor |
|-------|--------|
| ID | TSK-001 |
| Status | Doing |
| Pai | — |
| Board | [Flow](../../../board.md) |
| Output | [`epics/`](../../epics/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T001[TSK-001 Criar epico]
  T002[TSK-002 Criar as historias]
  T003[TSK-003 Explorar]
  T007[TSK-007 Criar arquivo]
  T008[TSK-008 Remover arquivo]
  T009[TSK-009 Renomear arquivo]
  T010[TSK-010 Mover arquivo]
  T011[TSK-011 Visualizar arvore]
  T012[TSK-012 Toggle filhos]
  T004[TSK-004 Board]
  T005[TSK-005 Gantt]
  T006[TSK-006 Arvore execucao]
  T001 --> T002
  T002 --> T003
  T003 --> T007
  T003 --> T008
  T003 --> T009
  T003 --> T010
  T003 --> T011
  T003 --> T012
  T002 --> T004
  T002 --> T005
  T002 --> T006
  style T001 fill:#fff3cd
  style T007 fill:#d4edda
  style T008 fill:#d4edda
  style T009 fill:#d4edda
  style T010 fill:#d4edda
```

## Objetivo

Criar os épicos do projeto Flow.

## Filhos

- [`TSK-002`](TSK-002-criar-as-historias/README.md) — Criar as histórias
  - [`TSK-003`](TSK-002-criar-as-historias/TSK-003-explorar/README.md) — Explorar → Output [EP-01](../../epics/EP-01-explorar/README.md)
  - [`TSK-004`](TSK-002-criar-as-historias/TSK-004-board/README.md) — Board → Output [EP-02](../../epics/EP-02-board/README.md)
  - [`TSK-005`](TSK-002-criar-as-historias/TSK-005-gantt/README.md) — Gantt → Output [EP-03](../../epics/EP-03-gantt/README.md)
  - [`TSK-006`](TSK-002-criar-as-historias/TSK-006-arvore-de-execucao/README.md) — Árvore de execução → Output [EP-04](../../epics/EP-04-arvore-de-execucao/README.md)
