# US-03 — Remover atividade

| Campo | Valor |
|-------|--------|
| ID | US-03 |
| Épico | [EP-04 Árvore de execução](../README.md) |
| Task | [TSK-075](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-006-arvore-de-execucao/TSK-075-remover-atividade/README.md) |
| Status | Doing |

## História

Como usuário da Árvore de execução, quero **remover uma atividade**, para limpar a hierarquia de execução.

## Print

_(protótipo pendente)_

## Cenários

### SC-01 — Selecionar atividade

Quando o usuário **selecionar uma atividade** na árvore, o sistema deve **destacar a atividade selecionada**.

### SC-02 — Opção Remover no menu transversal

Quando o usuário **selecionar uma atividade** e no **menu transversal** **clicar no ícone Remover**, o sistema deve **abrir um prompt de confirmação**.

### SC-03 — Pressionar Delete

Quando o usuário **pressionar Delete** com uma atividade selecionada, o sistema deve **abrir um prompt de confirmação**.

### SC-04 — Cancelar confirmação

Quando o usuário **clicar em Cancelar** no prompt, o sistema **não deve excluir** a atividade e **não deve alterar** a árvore nem o Explorar.

### SC-05 — Confirmar exclusão

Quando o usuário **clicar em Confirmar** no prompt, o sistema deve **apagar a atividade e sua subárvore** na Árvore de execução e no Explorar.
