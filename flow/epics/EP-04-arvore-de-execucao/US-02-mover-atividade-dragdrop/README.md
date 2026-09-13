# US-02 — Mover atividade (drag and drop)

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-04 Árvore de execução](../README.md) |
| Task | [TSK-074](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-006-arvore-de-execucao/TSK-074-mover-atividade-dragdrop/README.md) |
| Status | Doing |

## História

Como usuário da Árvore de execução, quero **mover uma atividade por drag and drop**, para reorganizar a hierarquia de pais e filhos.

## Print

_(protótipo pendente)_

## Cenários

### SC-01 — Arrastar atividade

Quando o usuário **pressionar e arrastar uma atividade** na árvore, o sistema deve **iniciar o gesto de mover**.

### SC-02 — Mover para filho

Quando o usuário **soltar a atividade dentro de outra**, o sistema deve **mover a atividade como filha** dessa atividade.

### SC-03 — Mover para irmão

Quando o usuário **soltar a atividade ao lado de outra** (mesmo nível), o sistema deve **mover a atividade como irmã**, sob o mesmo pai.

### SC-04 — Desaninhar (tornar raiz)

Quando o usuário **soltar a atividade na raiz da floresta**, o sistema deve **desaninhar a atividade**, tornando-a uma **nova raiz**.

### SC-05 — Rejeitar ciclo

Quando o usuário **tentar mover uma atividade para dentro de um de seus descendentes**, o sistema deve **rejeitar o movimento** e **manter a hierarquia**.

### SC-06 — Hierarquia refletida no Explorar

Quando a atividade **mudar de hierarquia**, o sistema deve **atualizar o Explorar**, exibindo a atividade na nova posição da árvore.

### SC-07 — Atividade atualizada na árvore

Quando a atividade **for movida**, o sistema deve **exibi-la na nova posição** da Árvore de execução.
