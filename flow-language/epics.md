# Flow Language — Épicos

Alinhado à [visão](README.md).

**Premissa:** ferramenta de criação de código por manipulação visual; exporta para qualquer linguagem; **v1 = JavaScript e Python**.

**IDs:** `1` = épico · `1.1` = estória · `1.1.1` = cenário.

---

## Índice

| ID | Épico | Entrega |
|----|-------|---------|
| 1 | Edição visual | Criar e alterar código no canvas |
| 2 | Exportação | Gerar JavaScript e Python |
| 3 | Multi-linguagem | Novos alvos de exportação sem redefinir a ferramenta |

---

## 1 — Edição visual

Criar e alterar código no canvas (funções, dados, entradas, saídas, ligações).

### Estórias de usuário

| ID | Estória | O que faz |
|----|---------|-----------|
| 1.1 | Criar função | Adicionar nó de função no canvas |
| 1.2 | Definir entrada | Nomear entrada de uma função |
| 1.3 | Definir saída | Nomear saída de uma função |
| 1.4 | Remover nó | Remover função ou dado do canvas |
| 1.5 | Mover nó | Reposicionar nó no canvas |
| 1.6 | Renomear função | Alterar o nome de uma função no canvas |
| 1.7 | Renomear entrada/saída | Alterar nome do pin |

#### 1.1 — Criar função

Como usuário da edição visual, quero **criar uma função** no canvas, para compor o fluxo com um novo nó de função.

##### Cenários

| ID | Cenário | Quando | Então |
|----|---------|--------|-------|
| 1.1.1 | Acionar criar função | Usuário aciona criar função no canvas | Sistema adiciona um nó de função no canvas |
| 1.1.2 | Nó visível no canvas | Função for criada | Sistema exibe o nó de função na área do canvas |
| 1.1.3 | Nome inicial da função | Função for criada | Sistema atribui um nome inicial ao nó (padrão ou editável imediatamente) |
| 1.1.4 | Função selecionada após criar | Função for criada | Sistema seleciona o novo nó no canvas |

---

## 2 — Exportação

Gerar código a partir do modelo visual. Alvos v1: **JavaScript** e **Python**.

### Estórias de usuário

| ID | Estória | O que faz |
|----|---------|-----------|
| 2.1 | Exportar para JavaScript | Gerar código JS a partir do canvas/modelo |
| 2.2 | Exportar para Python | Gerar código Python a partir do canvas/modelo |
| 2.3 | Escolher alvo de exportação | Selecionar JavaScript ou Python |
| 2.4 | Recusar export inválido | Não exportar se o modelo estiver incompleto ou inválido |

---

## 3 — Multi-linguagem

Arquitetura para exportar para qualquer linguagem; além de JS e Python fica fora do v1.

### Estórias de usuário

| ID | Estória | O que faz |
|----|---------|-----------|
| 3.1 | Registrar alvo de exportação | Permitir plugar um novo gerador de linguagem |
| 3.2 | Listar alvos disponíveis | Mostrar linguagens que já têm exportação |
| 3.3 | Recusar alvo sem gerador | Informar quando a linguagem ainda não é suportada |

---

## Ordem de entrega (v1)

1. Edição visual  
2. Exportação (JavaScript, depois Python)  
3. Multi-linguagem (contrato de extensão)

## Fora de escopo (v1)

- Exportação além de JavaScript e Python  
- Board, Gantt, Explorar, responsáveis (Flow / Plans)  
- Persistência, permissões, multi-usuário  

## Próximos passos

→ [`docs/README.md`](docs/README.md)
