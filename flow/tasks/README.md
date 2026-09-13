# Flow — Tasks

Cada item da raia Flow no [`board.md`](../board.md) tem um **id**, uma **pasta** e um **output** em [`epics/`](../epics/).

## Hierarquia

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
  style T002 fill:#fff3cd
  style T003 fill:#fff3cd
  style T007 fill:#d4edda
  style T008 fill:#d4edda
  style T009 fill:#d4edda
```

| ID | Task | Status | Output |
|----|------|--------|--------|
| TSK-001 | Criar épico | Doing | [`epics/`](../epics/README.md) |
| TSK-002 | Criar as histórias | Doing | [`epics/`](../epics/README.md) |
| TSK-003 | Explorar | Doing | [EP-01](../epics/EP-01-explorar/README.md) |
| TSK-004 | Board | Todo | [EP-02](../epics/EP-02-board/README.md) |
| TSK-005 | Gantt | Todo | [EP-03](../epics/EP-03-gantt/README.md) |
| TSK-006 | Árvore de execução | Todo | [EP-04](../epics/EP-04-arvore-de-execucao/README.md) |
| TSK-007 | Criar arquivo | Done | [US-01](../epics/EP-01-explorar/US-01-criar-arquivo/README.md) |
| TSK-008 | Remover arquivo | Done | [US-02](../epics/EP-01-explorar/US-02-remover-arquivo/README.md) |
| TSK-009 | Renomear arquivo | Done | [US-03](../epics/EP-01-explorar/US-03-renomear-arquivo/README.md) |
| TSK-010 | Mover arquivo | Todo | [US-04](../epics/EP-01-explorar/US-04-mover-arquivo-dragdrop/README.md) |
| TSK-011 | Visualizar árvore | Todo | [US-05](../epics/EP-01-explorar/US-05-visualizar-arvore-de-arquivos/README.md) |
| TSK-012 | Toggle filhos | Todo | [US-06](../epics/EP-01-explorar/US-06-toggle-visualizar-filhos/README.md) |
