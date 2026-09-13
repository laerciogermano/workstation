# Board

Kanban da workstation: **uma raia por projeto**, colunas **Todo**, **Doing** e **Done**.

Raias ordenadas por **prioridade** (maior → menor).  
Quando houver hierarquia de tasks, a raia usa **Mermaid** (árvore + cor de status) em vez de forçar árvore dentro da tabela kanban.

---

## P1 — ConnectMax

| Todo | Doing | Done |
|------|-------|------|
| Criar épico | | |

→ [`connectmax/`](connectmax/README.md)

---

## P2 — Flow

Pré-requisito do Plans.  
Legenda: verde = Done · amarelo = Doing · cinza = Todo

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
```

| Todo | Doing | Done |
|------|-------|------|
| [TSK-007](flow/epics/EP-01-explorar/US-01-criar-arquivo/README.md) Criar arquivo | [TSK-001](flow/tasks/TSK-001-criar-epico/README.md) Criar épico | — |
| [TSK-008](flow/epics/EP-01-explorar/US-02-remover-arquivo/README.md) Remover arquivo | [TSK-002](flow/tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/README.md) Criar as histórias | |
| [TSK-009](flow/epics/EP-01-explorar/US-03-renomear-arquivo/README.md) Renomear arquivo | [TSK-003](flow/epics/EP-01-explorar/README.md) Explorar | |
| [TSK-010](flow/epics/EP-01-explorar/US-04-mover-arquivo-dragdrop/README.md) Mover arquivo | | |
| [TSK-011](flow/epics/EP-01-explorar/US-05-visualizar-arvore-de-arquivos/README.md) Visualizar árvore | | |
| [TSK-012](flow/epics/EP-01-explorar/US-06-toggle-visualizar-filhos/README.md) Toggle visualizar filhos | | |
| [TSK-004](flow/epics/EP-02-board/README.md) Board | | |
| [TSK-005](flow/epics/EP-03-gantt/README.md) Gantt | | |
| [TSK-006](flow/epics/EP-04-arvore-de-execucao/README.md) Árvore de execução | | |

→ [`flow/`](flow/README.md) · [`flow/tasks/`](flow/tasks/README.md) · [`flow/epics/`](flow/epics/README.md) · [`flow/gantt.md`](flow/gantt.md)

---

## P3 — Plans

| Todo | Doing | Done |
|------|-------|------|
| | | Criar épico |

→ [`plans/`](plans/README.md) · [`plans/epics/`](plans/epics/README.md)

---

## P4 — RoleGo

| Todo | Doing | Done |
|------|-------|------|
| | | |

→ [`role-go/`](role-go/README.md)

---

## P5 — Chines

| Todo | Doing | Done |
|------|-------|------|
| | | |

→ [`chines/`](chines/docs/README.md)

---

## P6 — Caronas

| Todo | Doing | Done |
|------|-------|------|
| | | |

→ [`caronas/`](caronas/README.md)

---

## P7 — Fitness

| Todo | Doing | Done |
|------|-------|------|
| | | |

→ [`fitness/`](fitness/README.md)

---

## P8 — Eternos Mutáveis

| Todo | Doing | Done |
|------|-------|------|
| | | |

→ [`eternos-mutaveis/`](eternos-mutaveis/README.md)

---

## P9 — Jiu-jitsu

| Todo | Doing | Done |
|------|-------|------|
| | | |

→ [`jiu-jitsu/`](jiu-jitsu/README.md)
