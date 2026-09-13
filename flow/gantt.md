# Flow — Gantt

Ordem temporal das atividades a partir da [hierarquia de tasks](tasks/README.md).  
Datas são relativas (planejamento); ajuste conforme a execução.

```mermaid
gantt
    title Flow - ordem das atividades
    dateFormat YYYY-MM-DD
    axisFormat %d/%m

    section Epico
    "TSK-001 Criar epico"                 :active, t001, 2026-09-13, 3d

    section Historias
    "TSK-002 Criar as historias"          :active, t002, after t001, 1d

    section Explorar
    "TSK-003 Explorar"                    :active, t003, after t002, 1d
    "TSK-007 Criar arquivo"               :t007, after t003, 1d
    "TSK-008 Remover arquivo"             :t008, after t007, 1d
    "TSK-009 Renomear arquivo"            :t009, after t008, 1d
    "TSK-010 Mover arquivo"               :t010, after t009, 1d
    "TSK-011 Visualizar arvore"           :t011, after t010, 1d
    "TSK-012 Toggle visualizar filhos"    :t012, after t011, 1d

    section Demais epicos
    "TSK-004 Board"                       :t004, after t012, 2d
    "TSK-005 Gantt"                       :t005, after t004, 2d
    "TSK-006 Arvore de execucao"          :t006, after t005, 2d
```

## Ordem (sequência)

1. **TSK-001** Criar épico  
2. **TSK-002** Criar as histórias  
3. **TSK-003** Explorar → **TSK-007** … **TSK-012** (histórias do Explorar, em sequência)  
4. **TSK-004** Board  
5. **TSK-005** Gantt  
6. **TSK-006** Árvore de execução  

→ [`tasks/`](tasks/) · [`../board.md`](../board.md)
