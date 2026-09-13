# US-04 — Mover arquivo (drag and drop)

| Campo | Valor |
|-------|--------|
| ID | US-04 |
| Épico | [EP-01 Explorar](../) |
| Task | [TSK-010](../../../tasks/TSK-001-criar-epico/TSK-002-criar-as-historias/TSK-003-explorar/TSK-010-mover-arquivo-dragdrop/) |
| Status | Doing |

## História

Como usuário do Explorar, quero **mover um arquivo por drag and drop** na árvore, para reorganizar a hierarquia com o gesto de um explorador de IDE.

## Print

![Mover arquivo drag and drop](print.png)

## Cenários

### SC-01 — Arrastar arquivo no Explorar

Quando o usuário **pressionar e arrastar um arquivo** na árvore do Explorar, o sistema deve **iniciar o gesto de mover**, indicando o arquivo em movimento.

### SC-02 — Soltar sobre uma pasta destino

Quando o usuário **soltar o arquivo sobre uma pasta** da árvore, o sistema deve **mover o arquivo para essa pasta**.

### SC-03 — Arquivo atualizado na hierarquia

Quando o arquivo **for movido**, o sistema deve **exibi-lo sob a pasta destino** no Explorar e **removê-lo da pasta de origem**.
