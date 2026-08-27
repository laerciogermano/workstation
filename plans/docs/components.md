# Componentes por tela — Plans

Inventário de telas e componentes de interface derivado de [`screens.md`](screens.md).

Legenda de tipos: **Filtro** · **Tabela** · **Card** · **Formulário** · **Lista** · **Indicador** · **Badge** · **Ação** · **Modal** · **Preview** · **Seletor** · **Grade** · **Canvas** · **Árvore** · **Editor** · **Navegação** · **Drawer**

---

## Índice

| Tela | Componentes |
|------|-------------|
| [TELA-01](#tela-01--board-kanban) | grade kanban, cards, config colunas/raias, hierarquia, status IA |
| [TELA-02](#tela-02--detalhe-da-unidade) | drawer identidade, formulário, responsável, ciclo de vida, troca de visão |
| [TELA-03](#tela-03--plano--gantt) | eixo temporal, FOP, máquina, exportação, dependências, AIs |
| [TELA-04](#tela-04--árvore-de-execução) | floresta, nós, responsáveis, procedimento máquina |
| [TELA-05](#tela-05--explorar-lista-e-navegação) | busca, lista, breadcrumb, drill-down |
| [TELA-06](#tela-06--detalhe-do-arquivo-no-explorar) | formulário arquivo, metadados, atalhos de visão |
| [TELA-07](#tela-07--catálogo-de-responsáveis) | abas por tipo, tabela catálogo, CRUD, bloqueio remoção |
| [Transversais](#componentes-transversais) | detalhe unidade, explorar, configurações, troca de visão |

---

## TELA-01 — Board (kanban)

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

## TELA-05 — Explorar (lista e navegação)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Busca por título | Filtro | Filtra arquivos pelo título |
| Lista de arquivos | Lista | Ordenada por título |
| Badge arquivado | Badge | Unidades arquivadas ainda acessíveis |
| Breadcrumb | Navegação | Caminho da hierarquia atual |
| Drill-down | Navegação | Entrar/sair de níveis sem limite de profundidade |
| Empty state de busca | Indicador | Sem resultados com indicação clara |
| Empty state lista | Indicador | Lista vazia utilizável |
| Abrir arquivo | Navegação | TELA-06 |
| Atalhos de visão | Navegação | Board, Gantt, Árvore na mesma unidade |

---

## TELA-06 — Detalhe do arquivo no Explorar

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Formulário canônico | Formulário | UUID, título, contexto, responsável, saídas (espelho TELA-02) |
| Metadados de persistência | Indicador | Arquivamento, timestamps |
| Botão desarquivar | Ação | Se unidade arquivada |
| Botões salvar campos | Ação | Reflete em todas as visões |
| Grupo troca de visão | Navegação | Board, Gantt, Árvore |
| Voltar à lista | Navegação | TELA-05 |

---

## TELA-07 — Catálogo de responsáveis

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

### Layout global

| Componente | Tipo | Telas |
|------------|------|-------|
| Menu principal (visões) | Navegação | Board, Gantt, Árvore |
| Bloco transversal (rodapé) | Navegação | Explorar + Configurações |
| Breadcrumb / título da tela | Navegação | Telas internas |
| Cabeçalho com persona | Navegação | Todas |

### Detalhe da unidade (US-01, US-02)

| Componente | Tipo | Telas |
|------------|------|-------|
| Drawer compartilhado (TELA-02) | Drawer | Board, Gantt, Árvore, Explorar |
| Seletor de responsável tipado | Seletor | Drawer; catálogo (TELA-07) alimenta opções |

### Explorar (transversal)

| Componente | Tipo | Telas |
|------------|------|-------|
| Entrada Explorar no rodapé da nav | Navegação | Global |
| Lista / busca / breadcrumb | Lista | TELA-05 |
| Detalhe do arquivo | Formulário | TELA-06 |

### Configurações (transversal, abaixo do Explorar)

| Componente | Tipo | Telas |
|------------|------|-------|
| Entrada Configurações no rodapé da nav | Navegação | Global, abaixo de Explorar |
| Catálogo de responsáveis | Tabela | TELA-07 |

### Troca de visão (US-01, US-17)

| Componente | Tipo | Telas |
|------------|------|-------|
| Botões “Abrir no…” | Navegação | Board, Gantt, Árvore, Explorar, detalhe |
| Preservação de UUID | Indicador | Mesma entidade em todas as superfícies |

### Componentes reutilizados

| Componente | Tipo | Onde aparece |
|------------|------|--------------|
| Badge de responsável | Badge | Board, Gantt, Árvore, Explorar, detalhe |
| Badge de status IA | Badge | Board, Gantt |
| Modal de confirmação | Modal | Excluir unidade, remover coluna/raia, excluir plano |
| Empty state | Indicador | Listas e árvores sem itens |
| Toast / snackbar | Indicador | Salvar, exportar, erro de validação |
| Validação inline | Indicador | Título obrigatório; datas início ≤ fim; libs v1 |
