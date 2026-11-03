# PRD — Board

**Produto:** Board  
**Status:** rascunho v1 (2026-11-03)  
**Visão:** [`../README.md`](../README.md) · **Arquitetura:** [`arquitetura.md`](arquitetura.md) · **DS:** [`design-system.md`](design-system.md)

---

## 1. Definição (o quê)

O **Board** é um **substituto do Trello** para **gestão própria**: aplicação web com boards, listas, cards e as operações básicas de um kanban (criar, mover, rotular, prazo, checklist, comentar, arquivar, buscar), com dados sob controle do operador (self-hosted / lab).

## 2. Problema

Gestão de trabalho depende do Trello SaaS; o lab já tem processo e inventário em markdown, mas **não tem app kanban operável**. Falta paridade básica (board → lista → card → metadados) sem depender de terceiros.

## 3. Personas

| Persona | Job |
|---------|-----|
| **Operador** | Abre boards, move cards no fluxo, atualiza status do trabalho |
| **Dono** | Cria boards/listas/labels e define a estrutura do fluxo |
| **Leitor (v1.1+)** | Consulta board sem editar |

## 4. Capacidades-alvo (must / should)

### 4.1 Conta e sessão — *must*
- Cadastro/login mínimo (e-mail + senha ou usuário local).
- Sessão autenticada; boards pertencem ao dono da sessão.
- Logout.

### 4.2 Boards — *must*
- Criar board (nome + cor/capa simples opcional).
- Listar boards do dono; abrir board.
- Renomear; arquivar board.
- Board aberto mostra listas horizontais e cards.

### 4.3 Listas — *must*
- Criar lista no board; renomear.
- Reordenar listas (drag ou API de posição).
- Arquivar lista (cards vão junto para o arquivo da lista).

### 4.4 Cards — *must*
- Criar card em uma lista (título obrigatório).
- Editar título e descrição (markdown simples ok).
- Reordenar dentro da lista; mover para outra lista (posição explícita).
- Regra de produto documentável: ao concluir, card pode ir para o **topo** da lista alvo (ex. Concluído) — configurável por board ou default documentado.

### 4.5 Labels — *must*
- Catálogo de labels por board (nome + cor).
- Atribuir / remover labels no card.
- Filtro por label no board.

### 4.6 Due date — *must*
- Definir / limpar data (e opcionalmente hora) no card.
- Indicação visual: no prazo / próximo / atrasado.

### 4.7 Checklist — *must*
- Uma ou mais checklists por card; itens com done/undone.
- Progresso visível no card (ex. 2/5).

### 4.8 Comentários — *must*
- Adicionar comentário de texto no card; listar em ordem cronológica.
- Autor = usuário da sessão; timestamp.

### 4.9 Arquivo — *must*
- Arquivar / restaurar card.
- Arquivar / restaurar lista.
- Painel ou rota “Arquivo” no board.

### 4.10 Busca — *must*
- Busca por texto (título/descrição) no board aberto.
- Filtros: label, due (com / sem / atrasado).

### 4.11 API — *must*
- API autenticada cobrindo CRUD das entidades do modelo.
- Web consome só a API (sem SQL no front).

### 4.12 Import / export — *should* (v1.1)
- Export JSON/CSV do board.
- Import CSV mínimo (título + lista).

### 4.13 Tempo real — *should* (v1.1)
- Atualização entre abas (WS ou polling); não bloqueia MVP com refresh manual.

## 5. Não-objetivos (v1)

- Butler / regras de automação complexas
- Power-Ups de terceiros
- Anexos de arquivo grandes
- Workspaces multi-time / permissões granulares além de dono
- App store / mobile nativo
- Paridade 100% com Trello Premium

## 6. Critérios de sucesso (MVP)

1. Operador cria um board com 4 listas e usa no dia a dia no lugar de um board Trello simples.
2. Card completo (labels + due + checklist + comentário) persiste após reload.
3. Mover card entre listas preserva ordem e é refletido na API.
4. Arquivar e restaurar card funciona sem perda de metadados.
5. Dados residem no Postgres do lab (backup = dump DB).

## 7. Métricas (qualitativas v1)

- Tempo para “primeiro board útil” < 5 min após login.
- Zero dependência de trello.com para o fluxo Todo/Doing/Done da workstation (meta de migração).

## 8. Riscos

| Risco | Mitigação |
|-------|-----------|
| Escopo inchando para “clone Trello completo” | PRD must/should; config-ia bloqueia Power-Ups sem pedido |
| DnD frágil | Contrato de posição na API; testes e2e no movimento |
| Auth fraca no lab | MVP local ok; documentar não expor sem HTTPS/auth forte |

## 9. Roadmap de produto (alto nível)

| Fase | Entrega |
|------|---------|
| **MVP** | Conta + board + lista + card + move + label + due + checklist + comentário + arquivo + busca |
| **v1.1** | Import/export · tempo real leve · leitor read-only |
| **v1.2** | Anexos leves · templates de board · deep-link card |

Discovery detalhado: [`discovery/`](discovery/README.md).

## Rollback documental

```bash
# remove o projeto Board do works (só docs nesta fase)
rm -rf board/
# e reverta a linha Board no README.md da workstation
```
