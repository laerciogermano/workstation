# US-01 — Criar atividade

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-04 Árvore de execução](../README.md) |
| Task | [TSK-073](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-006-arvore-de-execucao/TSK-073-criar-atividade/README.md) |
| Status | Doing |

## História

Como usuário da Árvore de execução, quero **criar uma atividade** (raiz ou filha), para decompor a execução em pais e filhos.

## Print

_(protótipo pendente)_

## Cenários

### SC-01 — Criar atividade raiz

Quando o usuário **acionar a criação de atividade raiz** e **informar o título**, o sistema deve **criar a atividade como nova raiz** na floresta.

### SC-02 — Criar atividade filha

Quando o usuário **selecionar uma atividade**, **acionar a criação de filha** e **informar o título**, o sistema deve **criar a atividade subordinada** a essa atividade.

### SC-03 — Opção Criar atividade no menu transversal

Quando o usuário **selecionar uma atividade** e no **menu transversal** **clicar no ícone Criar atividade**, o sistema deve **abrir a opção de dar nome** à nova atividade filha.

### SC-04 — Título obrigatório

Quando o usuário **tentar criar** sem informar o título, o sistema deve **rejeitar a criação**.

### SC-05 — Atividade aparece na árvore

Quando a atividade **for criada**, o sistema deve **exibi-la na Árvore de execução** na posição hierárquica correta.
