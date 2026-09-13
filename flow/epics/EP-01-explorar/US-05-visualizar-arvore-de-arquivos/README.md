# US-05 — Visualizar árvore de arquivos

| Campo | Valor |
|-------|--------|
| ID | US-05 |
| Épico | [EP-01 Explorar](../) |
| Task | [TSK-011](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-003-explorar/TSK-011-visualizar-arvore-de-arquivos/) |
| Status | Done |

## História

Como usuário do Explorar, quero **visualizar a árvore de arquivos** e **expandir ou recolher** os nós, para navegar a hierarquia no painel estilo IDE.

## Print

![Visualizar árvore de arquivos](../../../images/Captura%20de%20tela%202026-09-13%20142940.png)

Referência: pasta **NOVA PASTA** expandida com o arquivo **teste.html** selecionado; chevron e ícone de recolher tudo na barra de ações.

## Cenários

### SC-01 — Exibir hierarquia no Explorar

Quando o usuário **abrir o Explorar**, o sistema deve **exibir a árvore de pastas e arquivos** no painel estilo IDE.

### SC-02 — Ver filhos sob a pasta

Quando uma pasta **estiver expandida** na árvore, o sistema deve **listar seus arquivos e pastas filhas** indentados sob ela.

### SC-03 — Selecionar item na árvore

Quando o usuário **clicar em um arquivo ou pasta** no Explorar, o sistema deve **destacar o item selecionado** na árvore.

### SC-04 — Expandir pasta

Quando o usuário **clicar no chevron** de uma pasta recolhida no Explorar, o sistema deve **expandir a pasta** e **mostrar seus filhos** na árvore.

### SC-05 — Recolher pasta

Quando o usuário **clicar no chevron** de uma pasta expandida no Explorar, o sistema deve **recolher a pasta** e **ocultar seus filhos** na árvore.

### SC-06 — Recolher tudo

Quando o usuário **clicar no ícone de recolher tudo** na barra do Explorar, o sistema deve **recolher todas as pastas** da árvore.
