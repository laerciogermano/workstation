# US-02 — Remover card

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-02 Board](../) |
| Task | [TSK-014](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-004-board/TSK-014-remover-card/) |
| Status | Todo |

## História

Como usuário do Board, quero **remover um card**, para limpar itens que não devem mais existir no kanban.

## Print

_(protótipo pendente)_

## Cenários

### SC-01 — Menu dos três pontos → Deletar

Quando o usuário **clicar nos três pontos** do card e escolher **Deletar**, o sistema deve **abrir um prompt de confirmação**.

### SC-02 — Cancelar confirmação

Quando o usuário **clicar em Cancelar** no prompt, o sistema **não deve excluir** o card e **deve manter** o card no Board.

### SC-03 — Confirmar exclusão

Quando o usuário **clicar em Confirmar** no prompt, o sistema deve **excluir o card** e **deixar de exibi-lo** no Board.
