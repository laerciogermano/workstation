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
| 1.1 | Visualizar Flow canvas | Exibir a área do canvas do fluxo |
| 1.2 | Criar função | Adicionar nó de função no canvas |
| 1.3 | Definir entrada | Nomear entrada de uma função |
| 1.4 | Definir saída | Nomear saída de uma função |
| 1.5 | Remover nó | Remover função ou dado do canvas |
| 1.6 | Mover nó | Reposicionar nó no canvas |
| 1.7 | Renomear função | Alterar o nome de uma função no canvas |
| 1.8 | Renomear entrada/saída | Alterar nome do pin |

#### 1.1 — Visualizar Flow canvas

Como usuário da edição visual, quero **visualizar o Flow canvas**, para ver e interagir com o fluxo de código.

##### Cenários

| ID | Cenário | Quando | Então |
|----|---------|--------|-------|
| 1.1.1 | Função main padrão | Usuário entra na tela | Sistema exibe a função `main` no canvas como padrão |
| 1.1.2 | Selecionar função | Usuário clica em cima da função | Sistema seleciona a função e exibe o menu transversal com opções |
| 1.1.3 | Selecionar entrada | Usuário clica em cima da entrada | Sistema seleciona a entrada e exibe o menu transversal com opções |
| 1.1.4 | Selecionar saída | Usuário clica em cima da saída | Sistema seleciona a saída e exibe o menu transversal com opções |

#### 1.2 — Criar função

Como usuário da edição visual, quero **criar uma função** no canvas, para compor o fluxo com um novo nó de função.

##### Cenários

| ID | Cenário | Quando | Então |
|----|---------|--------|-------|
| 1.2.1 | Criar função no clique | Usuário clica no canvas | Sistema exibe a função no canvas com a opção de nomear |
| 1.2.2 | Criar função pelo menu transversal | Usuário seleciona uma função e clica na opção de função | Sistema cria uma função filha |
| 1.2.3 | Criar função pela tecla F | Usuário seleciona uma função e pressiona a tecla F | Sistema cria uma função filha |
| 1.2.4 | Nomear ao criar | Usuário informa o nome e confirma | Sistema mantém a função no canvas com o nome informado |
| 1.2.5 | Cancelar criação | Usuário cancela a nomeação | Sistema não mantém a função no canvas |
| 1.2.6 | Nome vazio | Usuário confirma sem informar nome | Sistema rejeita a confirmação e mantém a opção de nomear |

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
