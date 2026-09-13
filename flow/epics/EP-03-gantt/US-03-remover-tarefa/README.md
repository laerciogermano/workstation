# US-03 — Remover tarefa

| Campo | Valor |
|-------|--------|
| ID | US-03 |
| Épico | [EP-03 Gantt](../README.md) |
| Task | [TSK-023](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-005-gantt/TSK-023-remover-tarefa/README.md) |
| Status | Doing |

## História

Como usuário do Gantt, quero **remover uma tarefa**, para limpar atividades que não devem mais existir no cronograma.

## Print

_(protótipo pendente)_

## Cenários

### SC-01 — Selecionar tarefa

Quando o usuário **selecionar uma tarefa** no Gantt, o sistema deve **destacar a tarefa selecionada**.

### SC-02 — Opção Remover no menu transversal

Quando o usuário **selecionar uma atividade** e no **menu transversal** **clicar no ícone Remover**, o sistema deve **abrir um prompt de confirmação**.

### SC-03 — Pressionar Delete

Quando o usuário **pressionar Delete** com uma tarefa selecionada, o sistema deve **abrir um prompt de confirmação**.

### SC-04 — Cancelar confirmação

Quando o usuário **clicar em Cancelar** no prompt, o sistema **não deve excluir** a tarefa e **não deve alterar** Gantt nem Explorar.

### SC-05 — Confirmar exclusão

Quando o usuário **clicar em Confirmar** no prompt, o sistema deve **apagar a atividade no Gantt e no Explorar**.
