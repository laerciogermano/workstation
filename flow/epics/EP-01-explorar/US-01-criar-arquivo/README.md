# US-01 — Criar arquivo

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-01 Explorar](../) |
| Task | [TSK-007](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-003-explorar/TSK-007-criar-arquivo/) |
| Status | Todo |

## História

Como usuário do Explorar, quero **criar um arquivo** na árvore, para materializar uma nova unidade no painel estilo IDE.

## Print

![Criar arquivo](../../../images/Captura%20de%20tela%202026-09-13%20060040.png)

Referência: pasta **NOVA PASTA** com ícone **+** (novo arquivo) na barra de ações.

## Cenários

### Cenário 1 — Clicar no ícone +

Quando o usuário **clicar no ícone +** (novo arquivo) na barra do Explorar, o sistema deve **criar um arquivo com a opção de dar nome** (campo de nome editável / inline).

### Cenário 2 — Confirmar nome com Enter

Quando o usuário **der o nome e pressionar Enter**, o arquivo deve **aparecer na lista** da árvore sob a pasta atual.

### Cenário 3 — Menu de contexto (botão direito)

Quando o usuário **clicar com o botão direito** e escolher **adicionar arquivo**, o sistema deve **produzir o mesmo efeito** do Cenário 1: campo para dar nome e, após Enter, o arquivo aparece na lista.
