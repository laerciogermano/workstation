# US-02 — Mover tarefa (drag and drop)

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-03 Gantt](../README.md) |
| Task | [TSK-022](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-005-gantt/TSK-022-mover-tarefa-dragdrop/README.md) |
| Status | Doing |

## História

Como usuário do Gantt, quero **mover uma tarefa por drag and drop**, para ajustar a posição temporal ou a hierarquia das atividades no cronograma.

## Print

_(protótipo pendente)_

## Cenários

### SC-01 — Arrastar tarefa no Gantt

Quando o usuário **pressionar e arrastar uma tarefa** no Gantt, o sistema deve **iniciar o gesto de mover**.

### SC-02 — Soltar em nova posição no tempo

Quando o usuário **soltar a tarefa em outra posição** do cronograma, o sistema deve **mover a tarefa** para essa posição no tempo.

### SC-03 — Mover para filho

Quando o usuário **soltar a tarefa dentro de outra atividade**, o sistema deve **mover a tarefa como atividade filha** dessa atividade.

### SC-04 — Mover para irmão

Quando o usuário **soltar a tarefa ao lado de outra atividade** (mesmo nível), o sistema deve **mover a tarefa como irmã** dessa atividade, sob o mesmo pai.

### SC-05 — Hierarquia refletida no Explorar

Quando a tarefa **mudar de hierarquia** (filho ou irmão), o sistema deve **atualizar o Explorar**, exibindo a tarefa na nova posição da árvore.

### SC-06 — Tarefa atualizada no Gantt

Quando a tarefa **for movida**, o sistema deve **exibi-la na nova posição** (e hierarquia, se aplicável) do Gantt.
