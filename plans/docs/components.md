# Componentes por tela — Plans

Inventário de telas e componentes de interface derivado de [`screens.md`](screens.md).

Legenda de tipos: **Filtro** · **Tabela** · **Card** · **Formulário** · **Lista** · **Indicador** · **Badge** · **Ação** · **Modal** · **Preview** · **Seletor** · **Grade** · **Canvas** · **Árvore** · **Editor** · **Navegação** · **Drawer**

---

## Mapa de navegação

Espelha [`screens.md`](screens.md): estrutura de chrome e superfícies onde os componentes vivem.

```
Plans
├── Visões (componente transversal — acima das telas)
│   ├── Board → TELA-01
│   ├── Gantt → TELA-03
│   └── Árvore de execução → TELA-04
│
├── Detalhe da unidade (drawer transversal) → TELA-02
│
└── Explorar (painel transversal — estilo explorador de IDE)
    ├── Lista em árvore (componente embutido, sempre visível)
    └── Configurações (fixo embaixo)
        └── Catálogo de responsáveis → TELA-05
```

**Transversais (componentes, não telas próprias):** Visões · Detalhe da unidade · Explorar (lista em árvore) · Configurações · Troca de visão.

---

## Índice

| Tela | Componentes |
|------|-------------|
| [Mapa de navegação](#mapa-de-navegação) | Visões · telas · Explorar · Configurações |
| [TELA-01](#tela-01--board-kanban) | grade kanban, cards, config colunas/raias, hierarquia, status IA |
| [TELA-02](#tela-02--detalhe-da-unidade) | drawer identidade, formulário, responsável, ciclo de vida, troca de visão |
| [TELA-03](#tela-03--plano--gantt) | eixo temporal, FOP, máquina, exportação, dependências, AIs |
| [TELA-04](#tela-04--árvore-de-execução) | floresta, nós, responsáveis, procedimento máquina |
| [TELA-05](#tela-05--catálogo-de-responsáveis) | abas por tipo, tabela catálogo, CRUD, bloqueio remoção |
| [Transversais](#componentes-transversais) | Visões (acima das telas), detalhe, Explorar, configurações |

---

## TELA-01 — Board (kanban)

### Mapa de componentes

```
TELA-01 Board
├── Visões (transversal — acima)
├── Grade kanban
│   ├── Colunas × raias
│   ├── Card de unidade
│   │   ├── Badge responsável
│   │   ├── Badge status IA
│   │   └── Indicação pai/filho
│   ├── Formulário novo card
│   ├── Drag-and-drop
│   └── Ações de hierarquia
├── Painel configurar board
│   ├── Lista ordenável colunas/raias
│   ├── Toggle coluna de execução
│   └── Remoção (bloqueio / aviso)
├── Abrir detalhe → TELA-02
└── Atalhos de visão → Gantt / Árvore / Explorar
```

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Grade kanban | Grade | Colunas (estágios) × raias (swimlanes) |
| Card de unidade | Card | Título, responsável tipado, indicação pai/filho |
| Badge coluna de execução | Badge | Destaca colunas que disparam IA |
| Badge status IA | Badge | `pendente`, `em execução`, `concluída`, `falhou`, `cancelada` |
| Formulário novo card | Formulário | Título obrigatório + contexto opcional (inline no board) |
| Drag-and-drop de card | Ação | Move entre qualquer coluna/raia válida (sem WIP em v1) |
| Ações de hierarquia | Ação | Aninhar, desaninhar; mover pai arrasta subárvore |
| Botão retry IA | Ação | Reexecuta quando status `falhou` |
| Painel configurar board | Drawer | Lista ordenável de colunas e raias no próprio board |
| Toggle coluna de execução | Formulário | Marca/desmarca disparo de IA |
| Aviso remoção bloqueada | Indicador | Exibido quando há cards na coluna/raia |
| Botão remover coluna/raia | Ação | Só habilitado se vazia (US-04) |
| Abrir detalhe | Navegação | Abre drawer TELA-02 |
| Atalhos de visão | Navegação | Abrir no Explorar / Gantt / Árvore |

---

## TELA-02 — Detalhe da unidade

### Mapa de componentes

```
TELA-02 Detalhe da unidade (drawer transversal)
├── Cabeçalho identidade (UUID + rótulo da visão)
├── Formulário título e contexto
├── Seletor de responsável (← catálogo TELA-05)
├── Lista de saídas / artefatos
├── Ciclo de vida
│   ├── Badge ativa / arquivada
│   ├── Arquivar / desarquivar
│   └── Excluir (confirmação)
├── Grupo troca de visão → Board / Gantt / Árvore / Explorar
└── Indicador merge indisponível (v1)
```

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Drawer / painel lateral | Drawer | Sobreposto às visões principais |
| Cabeçalho identidade | Indicador | UUID, vocabulário da visão (card / tarefa / atividade / arquivo) |
| Formulário título e contexto | Formulário | Título obrigatório; contexto opcional |
| Seletor de responsável | Seletor | Pessoa, IA, máquina ou nenhum — só catálogo (US-02) |
| Lista de saídas / artefatos | Lista | Artefatos ligados à unidade, quando existirem |
| Badge ciclo de vida | Badge | Ativa / arquivada |
| Botões arquivar / desarquivar | Ação | Alterna visibilidade no fluxo ativo |
| Botão excluir | Ação | Remoção global (com confirmação) |
| Grupo troca de visão | Navegação | Board, Gantt, Árvore, Explorar (mesmo UUID) |
| Indicador merge indisponível | Indicador | Merge fora de escopo em v1 |

---

## TELA-03 — Plano / Gantt

### Mapa de componentes

```
TELA-03 Plano / Gantt
├── Visões (transversal — acima)
├── Seletor de plano + barra de ações
├── Abas / modos
│   ├── Tempo
│   │   ├── Eixo temporal
│   │   ├── Lista sem datas
│   │   ├── Dependências (sequencial / paralelo)
│   │   ├── Hierarquia + roll-up
│   │   └── Executar / cancelar / retry AIs
│   ├── FOP
│   │   ├── Canvas FOP
│   │   ├── Artefatos de estado
│   │   └── Validação (órfãos / ciclo / contexto)
│   ├── Máquina
│   │   ├── Editor (libs v1, loops)
│   │   └── Preview execução
│   └── Exportar
│       ├── Opções (FOP-IR / TS / Python)
│       ├── Preview do artefato
│       └── Copiar / baixar
└── Abrir detalhe → TELA-02
```

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Seletor de plano | Seletor | Planos do projeto + plano padrão |
| Barra de ações do plano | Ação | Criar, renomear, excluir plano (regras do padrão) |
| Eixo temporal | Grade | Tarefas posicionadas por início/fim; duração derivada |
| Lista sem datas | Lista | Tarefas sem data válida, sinalizadas |
| Indicador de dependência | Indicador | Sequencial (finish-to-start) e paralelo |
| Controles de relação | Ação | Definir, remover, ajustar relações (US-09) |
| Hierarquia de tarefas | Árvore | Aninhar / desaninhar; roll-up de datas e estado |
| Badge status execução | Badge | Status IA nas tarefas do plano |
| Botões executar / cancelar / retry AIs | Ação | Orquestração parcial via AIs (US-11) |
| Formulário nova tarefa | Formulário | Título; datas; plano padrão se omitido |
| Abas / modos do Gantt | Seletor | Tempo · FOP · Máquina · Exportar |
| Canvas FOP | Canvas | Procedimentos, ligações saída→entrada, seleção/repetição |
| Painel artefatos de estado | Formulário | Entradas e saídas (nome + referência) |
| Painel validação FOP | Indicador | Aviso órfãos; bloqueio ciclo; contexto completo/incompleto |
| Editor máquina | Editor | Libs v1 (`stdio`, `fs`, `http`), loops `for`/`while` |
| Preview execução máquina | Preview | Saídas e status da última execução |
| Opções de exportação | Formulário | FOP-IR; TypeScript; Python |
| Preview do artefato | Preview | Código / IR gerado |
| Botão copiar / baixar | Ação | Ao concluir exportação |
| Abrir detalhe | Navegação | Drawer TELA-02 |

---

## TELA-04 — Árvore de execução

### Mapa de componentes

```
TELA-04 Árvore de execução
├── Visões (transversal — acima)
├── Floresta de atividades
│   ├── Nós (múltiplas raízes, hierarquia infinita)
│   ├── Label de responsável
│   ├── Empty state
│   ├── Formulário nova atividade
│   └── Ações de hierarquia
├── Editor de procedimento (se responsável = máquina)
├── Abrir detalhe → TELA-02
└── Atalhos de visão → Board / Gantt / Explorar
```

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Floresta de atividades | Árvore | Múltiplas raízes e nós aninhados |
| Label de responsável | Badge | Pessoa, IA ou máquina por nó |
| Empty state | Indicador | Árvore vazia ainda utilizável |
| Formulário nova atividade | Formulário | Título; raiz ou filha |
| Ações de hierarquia | Ação | Desaninhar, reorganizar pai, excluir subárvore |
| Editor de procedimento | Editor | Disponível se responsável = máquina (paridade parcial) |
| Abrir detalhe | Navegação | Drawer TELA-02 / atribuição US-02 |
| Atalhos de visão | Navegação | Board, Gantt, Explorar |

---

## TELA-05 — Catálogo de responsáveis

### Mapa de componentes

```
TELA-05 Catálogo de responsáveis
├── Entrada via Configurações (fixo sob Explorar)
├── Abas por tipo
│   ├── Pessoas
│   ├── IAs
│   └── Máquinas
├── Tabela do catálogo
│   ├── Identidade / tipo / em uso
│   ├── Formulário incluir
│   ├── Remover (bloqueio se em uso)
│   └── Lista de unidades em uso
└── Empty state por tipo
```

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Abas por tipo | Seletor | Pessoas · IAs · Máquinas |
| Tabela do catálogo | Tabela | Identidade, tipo, em uso como responsável |
| Formulário incluir item | Formulário | Dados mínimos do ator |
| Botão adicionar | Ação | Inclui no catálogo |
| Botão remover | Ação | Bloqueado se ainda for responsável de alguma unidade |
| Lista de unidades em uso | Lista | Para desbloqueio de remoção (reatribuição) |
| Empty state por tipo | Indicador | Sem itens atribuíveis naquele tipo |

---

## Componentes transversais

### Mapa de componentes

```
Transversais
├── Visões (acima das telas)
│   ├── Seletor Board · Gantt · Árvore
│   ├── Indicador visão ativa
│   └── Área de conteúdo da tela ativa
├── Detalhe da unidade → TELA-02
├── Explorar (painel IDE)
│   ├── Lista em árvore (embutida; título sempre legível)
│   └── Configurações (fixo)
│       └── Catálogo → TELA-05
└── Troca de visão (“Abrir no…” + UUID estável)
```

### Layout global

| Componente | Tipo | Telas |
|------------|------|-------|
| **Visões** (seletor de tipo) | Navegação | Transversal **acima** do conteúdo; navega Board · Gantt · Árvore |
| Área de conteúdo da tela ativa | Canvas | TELA-01 / TELA-03 / TELA-04 abaixo das Visões |
| Painel Explorar (rodapé da nav) | Navegação | Sempre visível (estilo IDE) |
| Breadcrumb / título da tela | Navegação | Telas internas |
| Cabeçalho com persona | Navegação | Todas |

### Visões (transversal, acima das telas) — US-01

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Seletor / abas de visão | Navegação | Troca entre Board, Gantt e Árvore sem ser uma tela própria |
| Indicador da visão ativa | Indicador | Qual tipo está preenchendo a área abaixo |
| Persistência de contexto | Indicador | Projeto (e unidade, se houver) permanece ao trocar de tipo |

### Detalhe da unidade (US-01, US-02)

| Componente | Tipo | Telas |
|------------|------|-------|
| Drawer compartilhado (TELA-02) | Drawer | Board, Gantt, Árvore |
| Seletor de responsável tipado | Seletor | Drawer; catálogo (TELA-05) alimenta opções |

### Explorar (painel transversal — não é tela de lista)

| Componente | Tipo | Onde |
|------------|------|------|
| Painel Explorar | Navegação | Layout global |
| Lista em árvore (embutida) | Árvore | **Componente** dentro do Explorar; sempre visível; drill-down infinito; **não** é tela |
| Título do nó | Indicador | **Sempre legível** em qualquer profundidade; indentação limitada + scroll horizontal se necessário |
| Badge / meta arquivado | Indicador | Nó da árvore (não substitui o título) |
| Empty state | Indicador | Árvore vazia utilizável |

### Configurações (fixas embaixo do Explorar)

| Componente | Tipo | Telas |
|------------|------|-------|
| Entrada Configurações fixa sob a árvore | Navegação | Global |
| Catálogo de responsáveis | Tabela | TELA-05 |

### Troca de visão (US-01, US-17)

| Componente | Tipo | Telas |
|------------|------|-------|
| Botões “Abrir no…” | Navegação | Board, Gantt, Árvore, detalhe; Explorar = destacar no painel |
| Preservação de UUID | Indicador | Mesma entidade ao mudar o tipo via Visões ou “Abrir no…” |

### Componentes reutilizados

| Componente | Tipo | Onde aparece |
|------------|------|--------------|
| Badge de responsável | Badge | Board, Gantt, Árvore, detalhe |
| Badge de status IA | Badge | Board, Gantt |
| Modal de confirmação | Modal | Excluir unidade, remover coluna/raia, excluir plano |
| Empty state | Indicador | Listas e árvores sem itens |
| Toast / snackbar | Indicador | Salvar, exportar, erro de validação |
| Validação inline | Indicador | Título obrigatório; datas início ≤ fim; libs v1 |
