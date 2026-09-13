# US-03 — Remover tarefa

| Campo | Valor |
|-------|--------|
| ID | US-03 |
| Épico | [EP-03 Gantt](../) |
| Task | [TSK-023](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-005-gantt/TSK-023-remover-tarefa/) |
| Status | Doing |

## História

Como usuário do Gantt, quero **remover uma tarefa**, para limpar atividades que não devem mais existir no cronograma.

## Print

_(protótipo pendente)_

## Cenários

### SC-01 — Acionar remoção

Quando o usuário **acionar a remoção** de uma tarefa no Gantt, o sistema deve **abrir um prompt de confirmação**.

### SC-02 — Cancelar confirmação

Quando o usuário **clicar em Cancelar** no prompt, o sistema **não deve excluir** a tarefa e **deve mantê-la** no Gantt.

### SC-03 — Confirmar exclusão

Quando o usuário **clicar em Confirmar** no prompt, o sistema deve **excluir a tarefa** e **deixar de exibi-la** no Gantt.
