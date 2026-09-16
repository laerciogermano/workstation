# Flow Language — Épicos

Alinhado à [visão](README.md).

**Premissa:** ferramenta de criação de código por manipulação visual; exporta para qualquer linguagem; **v1 = JavaScript e Python**.

---

## Índice

| ID | Épico | Entrega |
|----|-------|---------|
| EP-01 | Edição visual | Criar e alterar código no canvas |
| EP-02 | Exportação | Gerar JavaScript e Python |
| EP-03 | Multi-linguagem | Novos alvos de exportação sem redefinir a ferramenta |

---

## EP-01 — Edição visual

Criar e alterar código no canvas (funções, dados, entradas, saídas, ligações).

### Estórias de usuário

| ID | Estória | O que faz |
|----|---------|-----------|
| US-01 | Criar função | Adicionar nó de função no canvas |
| US-02 | Definir entrada | Nomear entrada de uma função |
| US-03 | Definir saída | Nomear saída de uma função |
| US-04 | Remover nó | Remover função ou dado do canvas |
| US-05 | Mover nó | Reposicionar nó no canvas |
| US-06 | Renomear função | Alterar o nome de uma função no canvas |
| US-07 | Renomear entrada/saída | Alterar nome do pin |

---

## EP-02 — Exportação

Gerar código a partir do modelo visual. Alvos v1: **JavaScript** e **Python**.

### Estórias de usuário

| ID | Estória | O que faz |
|----|---------|-----------|
| US-01 | Exportar para JavaScript | Gerar código JS a partir do canvas/modelo |
| US-02 | Exportar para Python | Gerar código Python a partir do canvas/modelo |
| US-03 | Escolher alvo de exportação | Selecionar JavaScript ou Python |
| US-04 | Recusar export inválido | Não exportar se o modelo estiver incompleto ou inválido |

---

## EP-03 — Multi-linguagem

Arquitetura para exportar para qualquer linguagem; além de JS e Python fica fora do v1.

### Estórias de usuário

| ID | Estória | O que faz |
|----|---------|-----------|
| US-01 | Registrar alvo de exportação | Permitir plugar um novo gerador de linguagem |
| US-02 | Listar alvos disponíveis | Mostrar linguagens que já têm exportação |
| US-03 | Recusar alvo sem gerador | Informar quando a linguagem ainda não é suportada |

---

## Ordem de entrega (v1)

1. EP-01 Edição visual  
2. EP-02 Exportação (JavaScript, depois Python)  
3. EP-03 Multi-linguagem (contrato de extensão)

## Fora de escopo (v1)

- Exportação além de JavaScript e Python  
- Board, Gantt, Explorar, responsáveis (Flow / Plans)  
- Persistência, permissões, multi-usuário  

## Próximos passos

→ [`docs/README.md`](docs/README.md)
