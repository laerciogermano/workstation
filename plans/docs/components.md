# Componentes por tela — Plans

Inventário de telas e componentes de interface derivado de [`screens.md`](screens.md).

Legenda de tipos: **Filtro** · **Tabela** · **Card** · **Formulário** · **Lista** · **Indicador** · **Badge** · **Ação** · **Modal** · **Preview** · **Seletor** · **Grade** · **Canvas** · **Árvore** · **Editor** · **Navegação** · **Drawer**

---

## Índice

| Tela | Componentes |
|------|-------------|
| [TELA-01](#tela-01--board-kanban) | grade kanban, cards, criação, hierarquia, status IA, ações |
| [TELA-02](#tela-02--configuração-de-colunas-e-raias) | listas ordenáveis, toggles execução, aviso remoção |
| [TELA-03](#tela-03--detalhe-da-unidade) | drawer identidade, formulário, responsável, ciclo de vida, troca de visão |
| [TELA-04](#tela-04--plano--gantt) | seletor plano, eixo temporal, dependências, roll-up, execução AIs |
| [TELA-05](#tela-05--editor-fop) | canvas fluxo, artefatos, ligações, estruturas, validação |
| [TELA-06](#tela-06--editor-máquina) | editor código, libs/loops, feedback, execução |
| [TELA-07](#tela-07--exportar-código) | status consistência, opções export, preview, download |
| [TELA-08](#tela-08--árvore-de-execução) | floresta, nós, responsáveis, procedimento máquina |
| [TELA-09](#tela-09--explorar-lista-e-navegação) | busca, lista, breadcrumb, drill-down |
| [TELA-10](#tela-10--detalhe-do-arquivo-no-explorar) | formulário arquivo, metadados, atalhos de visão |
| [TELA-11](#tela-11--catálogo-de-responsáveis) | abas por tipo, tabela catálogo, CRUD, bloqueio remoção |
| [Transversais](#componentes-transversais) | layout, drawer unidade, troca de visão, badges, empty state |

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
| Abrir detalhe | Navegação | Abre drawer TELA-03 |
| Atalhos de visão | Navegação | Abrir no Explorar / Gantt / Árvore |
| Link configurar board | Navegação | Abre TELA-02 |

---

## TELA-02 — Configuração de colunas e raias

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Lista de colunas | Lista | Nome, ordem, flag “coluna de execução” |
| Lista de raias | Lista | Nome, ordem |
| Controles de reordenação | Ação | Arrastar ou setas para ordenar |
| Toggle coluna de execução | Formulário | Marca/desmarca disparo de IA |
| Campo nome | Formulário | Adicionar / renomear coluna ou raia |
| Aviso remoção bloqueada | Indicador | Exibido quando há cards na coluna/raia |
| Botão remover | Ação | Só habilitado se vazia (US-04) |
| Botões salvar / cancelar | Ação | Persiste e volta ao Board (TELA-01) |

---

## TELA-03 — Detalhe da unidade

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

## TELA-04 — Plano / Gantt

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
| Links FOP / máquina / exportar | Navegação | TELA-05, TELA-06, TELA-07 |
| Abrir detalhe | Navegação | Drawer TELA-03 |

---

## TELA-05 — Editor FOP

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Canvas / lista do fluxo | Canvas | Procedimentos do plano selecionado |
| Painel artefatos de estado | Formulário | Entradas e saídas (nome + referência) |
| Ligações saída → entrada | Canvas | Conexões evidentes entre tarefas |
| Controles de estrutura | Ação | Sequência, paralelo, seleção, repetição (US-19) |
| Indicador de camada | Indicador | Endereços que se conhecem vs camadas distintas |
| Indicador de contexto | Indicador | Completo / incompleto para execução |
| Painel validação | Indicador | Aviso órfãos; bloqueio ciclo de estado |
| Botões ligar / desligar / remover | Ação | Manutenção de artefatos e conexões |
| Botão validar | Ação | Roda checagens do plano |
| Botão ir para exportar | Navegação | TELA-07 quando consistente |
| Voltar ao Gantt | Navegação | Mantém plano selecionado |

---

## TELA-06 — Editor máquina

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Editor de código | Editor | Programa da tarefa máquina |
| Seletor de bibliotecas v1 | Seletor | `stdio`, `fs`, `http` |
| Snippets de loop | Formulário | `for` / `while` |
| Painel entradas/saídas | Formulário | Estados ligados ao procedimento |
| Feedback de validação | Indicador | Sintaxe inválida ou lib fora de v1 |
| Botão salvar | Ação | Persiste ou rejeita programa inválido |
| Botão executar | Ação | Roda tarefa e atualiza saídas/status |
| Preview de saídas | Preview | Resultado da última execução |
| Voltar | Navegação | Gantt (TELA-04) ou detalhe (TELA-03) |

---

## TELA-07 — Exportar código

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Cabeçalho do plano | Indicador | Plano selecionado + status de consistência |
| Alerta de bloqueio | Indicador | Ciclo de estado impede exportação útil |
| Alerta de órfãos | Indicador | Aviso sem bloquear |
| Opções de destino | Formulário | FOP-IR; TypeScript; Python; exportação direta |
| Botão compilar FOP-IR | Ação | Gera representação intermediária |
| Botão exportar | Ação | Gera artefato na linguagem escolhida |
| Preview do artefato | Preview | Código / IR gerado |
| Botão copiar / baixar | Ação | Ao concluir exportação |
| Rejeição de destino | Indicador | Linguagens fora de v1 |

---

## TELA-08 — Árvore de execução

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Floresta de atividades | Árvore | Múltiplas raízes e nós aninhados |
| Label de responsável | Badge | Pessoa, IA ou máquina por nó |
| Empty state | Indicador | Árvore vazia ainda utilizável |
| Formulário nova atividade | Formulário | Título; raiz ou filha |
| Ações de hierarquia | Ação | Desaninhar, reorganizar pai, excluir subárvore |
| Editor de procedimento | Editor | Disponível se responsável = máquina (paridade parcial) |
| Abrir detalhe | Navegação | Drawer TELA-03 / atribuição US-02 |
| Atalhos de visão | Navegação | Board, Gantt, Explorar |

---

## TELA-09 — Explorar (lista e navegação)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Busca por título | Filtro | Filtra arquivos pelo título |
| Lista de arquivos | Lista | Ordenada por título |
| Badge arquivado | Badge | Unidades arquivadas ainda acessíveis |
| Breadcrumb | Navegação | Caminho da hierarquia atual |
| Drill-down | Navegação | Entrar/sair de níveis sem limite de profundidade |
| Empty state de busca | Indicador | Sem resultados com indicação clara |
| Empty state lista | Indicador | Lista vazia utilizável |
| Abrir arquivo | Navegação | TELA-10 |
| Atalhos de visão | Navegação | Board, Gantt, Árvore na mesma unidade |

---

## TELA-10 — Detalhe do arquivo no Explorar

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Formulário canônico | Formulário | UUID, título, contexto, responsável, saídas (espelho TELA-03) |
| Metadados de persistência | Indicador | Arquivamento, timestamps |
| Botão desarquivar | Ação | Se unidade arquivada |
| Botões salvar campos | Ação | Reflete em todas as visões |
| Grupo troca de visão | Navegação | Board, Gantt, Árvore |
| Voltar à lista | Navegação | TELA-09 |

---

## TELA-11 — Catálogo de responsáveis

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
| Menu principal | Navegação | Board, Gantt, Árvore, Explorar, Configurações |
| Breadcrumb / título da tela | Navegação | Telas internas |
| Cabeçalho com persona | Navegação | Todas |

### Detalhe da unidade (US-01, US-02)

| Componente | Tipo | Telas |
|------------|------|-------|
| Drawer compartilhado (TELA-03) | Drawer | Board, Gantt, Árvore, Explorar |
| Seletor de responsável tipado | Seletor | Drawer; catálogo (TELA-11) alimenta opções |

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
