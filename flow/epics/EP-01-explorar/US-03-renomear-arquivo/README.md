# US-03 — Renomear arquivo

| Campo | Valor |
|-------|--------|
| ID | US-03 |
| Épico | [EP-01 Explorar](../README.md) |
| Task | [TSK-009](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-003-explorar/TSK-009-renomear-arquivo/README.md) |
| Status | Done |

## História

Como usuário do Explorar, quero **renomear um arquivo** na árvore, para ajustar o título sem perder a identidade da unidade.

## Print

![Renomear arquivo — menu](../../../images/Captura%20de%20tela%202026-09-13%20143248.png)

![Renomear arquivo — campo inline](../../../images/Captura%20de%20tela%202026-09-13%20171825.png)

Referência: arquivo **teste.html** na pasta **NOVA PASTA**, com menu de contexto e opção **Rename...** (atalho **F2**), e campo de nome editável inline.

## Cenários

### SC-01 — Menu de contexto (botão direito) → Rename...

Quando o usuário **clicar com o botão direito** em um arquivo no Explorar e escolher **Rename...**, o sistema deve **abrir o campo de nome editável** (inline) no nó do arquivo.

### SC-02 — Selecionar e pressionar F2

Quando o usuário **selecionar um arquivo** no Explorar e **pressionar F2**, o sistema deve **abrir o campo de nome editável** (mesmo efeito do SC-01).

### SC-03 — Confirmar novo nome com Enter

Quando o usuário **digitar o novo nome e pressionar Enter**, o sistema deve **aplicar o novo nome** ao arquivo.

### SC-04 — Nome atualizado no Explorar

Quando o arquivo **for renomeado**, o sistema deve **exibir o novo nome no Explorar**, mantendo o arquivo na mesma posição da árvore.
