# Board — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) (PRD → arquitetura → design system → discovery) → app.

Derivados: [`docs/`](docs/README.md).  
PRD: [`docs/prd.md`](docs/prd.md).  
Arquitetura: [`docs/arquitetura.md`](docs/arquitetura.md).  
Design system: [`docs/design-system.md`](docs/design-system.md).  
Discovery: [`docs/discovery/`](docs/discovery/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Não confundir com** o kanban textual em [`core/tasks/`](../core/tasks/README.md) (mapa estático da workstation) nem com o board Trello externo. O **Board** é o **produto** que substitui o Trello na gestão própria.

---

## Visão

O **Board** é um **kanban próprio** — boards, listas, cards e fluxos básicos do Trello — para **gestão pessoal e de projetos da workstation**, sem depender de SaaS de terceiros.

## Problema

A gestão de trabalho hoje depende do Trello (ou equivalente): cards, listas e boards vivem fora do lab, com limite de controle, exportação e integração com o processo local.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Dependência externa** | Board crítico no Trello; regras (ex. Concluído no topo) e API fora do repositório. |
| **Dois mundos** | Processo em `core/processo` + tasks em markdown vs cards no Trello — sincronização manual. |
| **Gestão própria sem produto** | Kanban em `core/tasks` é inventário estático; não há drag, labels, due date nem checklist operáveis. |
| **Funcionalidades básicas dispersas** | Criar board/lista/card, mover, arquivar, filtrar — não há app local que cubra o núcleo do Trello. |

O lab **já tem** processo e tasks. O que falta é um **app kanban próprio** com o essencial do Trello.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Operador** | Quem roda a workstation (você / IAs sob comando) | Boards por projeto, mover cards entre listas, ver o que está Todo/Doing/Done |
| **Dono do board** | Quem define colunas e regras do fluxo | Criar boards, listas, labels, arquivar sem SaaS |
| **Leitor (futuro)** | Quem só consulta status | Ver board read-only / link compartilhado |

## Objetivo

Ser o **substituto do Trello** para gestão própria: mesmas operações básicas (board → lista → card → mover → metadados), dados sob controle local, alinhado ao processo da workstation.

## Proposta de valor

O Board trata o kanban como **produto local**: você cria boards, organiza listas, move cards e anexa o mínimo necessário (labels, due, checklist, descrição) sem conta Trello.

| Necessidade | O que o Board faz |
|-------------|-------------------|
| Ver o trabalho em colunas | Board com listas ordenáveis e cards |
| Mover trabalho no fluxo | Drag-and-drop (ou atalho) de card entre listas / posições |
| Detalhar o card | Título, descrição, labels, due date, checklist, comentários |
| Organizar vários contextos | Vários boards (ex. por projeto) |
| Não perder o que saiu do fluxo | Arquivar card/lista; restaurar do arquivo |
| Achar rápido | Busca e filtro por label / due / texto |

### Exemplos

**Board de projeto** — Operador cria o board “Robô Prospecção” com listas Todo → Doing → Pendente aprovação → Concluído; cards novos entram no topo de Concluído quando concluídos.

**Card com aceite** — Card “US-01 provisionar” ganha checklist (TDD, PR, revisão), due date e label `P1`.

**Arquivo** — Lista antiga “Backlog 2025” é arquivada; cards somem do board ativo e voltam pelo painel Arquivo.

## Princípios

1. **Paridade básica com Trello** — board, lista, card, move, label, due, checklist, comentário, arquivo; sem feature-creep de Power-Ups no v1.
2. **Gestão própria** — dados no seu ambiente (API + DB local/self-hosted); sem lock-in de SaaS.
3. **Board é a superfície** — a UI principal é o quadro kanban, não um dashboard genérico.
4. **Posição importa** — ordem de listas e de cards dentro da lista é dado de primeira classe (ex. Concluído: mais recente no topo).
5. **Alinhar ao processo** — nomes e fluxos podem espelhar Todo / Doing / Pendente aprovação / Done da workstation, sem obrigar.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Boards** | Criar, renomear, abrir, listar, arquivar board |
| **Listas** | Criar, renomear, reordenar, arquivar lista |
| **Cards** | Criar, editar título/descrição, reordenar, mover entre listas |
| **Labels** | Criar labels do board; atribuir/remover no card |
| **Due date** | Definir / limpar prazo no card; indicação visual |
| **Checklist** | Itens no card; marcar feito |
| **Comentários** | Texto no card (autor = usuário da sessão) |
| **Arquivo** | Arquivar/restaurar card e lista |
| **Busca / filtro** | Por texto, label, due |
| **Conta mínima** | Login local / sessão para ownership dos boards |
| **API** | CRUD REST (ou equivalente) consumido pelo web |

### Fora de escopo (v1)

- Power-Ups, automações tipo Butler, calendário Gantt
- Integração nativa com GitHub/Trello import completo (import CSV pode ser v1.1)
- App nativo mobile (v1 = web responsivo)
- Multi-workspace enterprise / SSO
- Anexos binários pesados / drive
- Tempo real multi-cursor obrigatório (polling ou WS simples ok depois)

## Modelo conceitual

```text
Workspace (implícito / dono)
  └── Board
        ├── Lista (posição)
        │     └── Card (posição)
        │           ├── Labels
        │           ├── Due date
        │           ├── Checklist items
        │           └── Comments
        └── Labels (catálogo do board)
```

## Stack pretendida (visão)

| Camada | Escolha v1 |
|--------|------------|
| Web | Vite + React |
| API | NestJS (padrão lab) |
| Dados | PostgreSQL |
| UI | Design system próprio ([`docs/design-system.md`](docs/design-system.md)) |

Detalhe: [`docs/arquitetura.md`](docs/arquitetura.md).

## Próximos passos

→ [`docs/prd.md`](docs/prd.md) · [`docs/arquitetura.md`](docs/arquitetura.md) · [`docs/design-system.md`](docs/design-system.md) · discovery [`docs/discovery/`](docs/discovery/README.md)
