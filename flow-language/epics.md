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

### Funcionalidades

| ID | Funcionalidade | O que faz |
|----|----------------|-----------|
| F-01.01 | Criar função | Adicionar nó de função no canvas |
| F-01.02 | Definir entrada | Nomear entrada de uma função |
| F-01.03 | Definir saída | Nomear saída de uma função |
| F-01.04 | Criar ligação | Ligar saída → entrada |
| F-01.05 | Remover nó | Remover função ou dado do canvas |
| F-01.06 | Renomear função | Alterar o nome de uma função no canvas |
| F-01.07 | Renomear entrada/saída | Alterar nome do pin |
| F-01.08 | Validar ligação | Impedir ligação entre endereços incompatíveis |

---

## EP-02 — Exportação

Gerar código a partir do modelo visual. Alvos v1: **JavaScript** e **Python**.

### Funcionalidades

| ID | Funcionalidade | O que faz |
|----|----------------|-----------|
| F-02.01 | Exportar para JavaScript | Gerar código JS a partir do canvas/modelo |
| F-02.02 | Exportar para Python | Gerar código Python a partir do canvas/modelo |
| F-02.03 | Escolher alvo de exportação | Selecionar JavaScript ou Python |
| F-02.04 | Recusar export inválido | Não exportar se o modelo estiver incompleto ou inválido |

---

## EP-03 — Multi-linguagem

Arquitetura para exportar para qualquer linguagem; além de JS e Python fica fora do v1.

### Funcionalidades

| ID | Funcionalidade | O que faz |
|----|----------------|-----------|
| F-03.01 | Registrar alvo de exportação | Permitir plugar um novo gerador de linguagem |
| F-03.02 | Listar alvos disponíveis | Mostrar linguagens que já têm exportação |
| F-03.03 | Recusar alvo sem gerador | Informar quando a linguagem ainda não é suportada |

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
