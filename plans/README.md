# Plans

Documento de **negócio** do produto — fonte do *quê* e das regras.  
Derivados: [`docs/`](docs/) (`epics` → `stories` → `versions` → `tech`). Esteira: [`docs/README.md`](docs/README.md).

---

## Problema

Ferramentas de gestão impõem hierarquias rígidas e fragmentam a mesma atividade conforme a tela. É preciso manter norte entre planejar, executar e explorar — e desenvolver de forma **redundante em múltiplas linguagens** a partir de uma **estrutura unificada** (linguagem visual → compilação → exportação).

## Objetivo

Organizar, acompanhar e visualizar o trabalho do projeto em **Board**, **Gantt**, **Árvore de execução** e **Explorar**, com responsáveis tipados (pessoa, IA, prestador, máquina) e planos tratáveis como linguagem de programação exportável (FOP).

## Princípios

1. **Uma unidade** — mesma entidade em todas as visões; só muda o nome.
2. **Hierarquia infinita** — aninhamento sem limite de profundidade, sem ciclos.
3. **Responsável tipado** — o tipo define o comportamento permitido.
4. **FOP no Gantt** — **estado** (entradas/saídas) + **procedimentos** (funções/tarefas).
5. **Linguagem visual unificada** — compilação única e exportação para outras linguagens.

## Modelo

### Unidade de trabalho

| Visão | Nome |
|-------|------|
| Board | **card** |
| Gantt | **tarefa** (**ordem**) |
| Árvore de execução | **atividade** (**nó**) |
| Explorar | **arquivo** |

Toda unidade tem **id canônico (UUID)** estável. Alteração em uma visão reflete nas demais. Toda unidade persiste como **arquivo** no Explorar.

**Campos mínimos:** **título** obrigatório em qualquer unidade. **Chamado** exige também **necessidade** e **serviço desejado**.

**Ciclo de vida:** **excluir** remove a unidade em todas as visões. **Arquivar** oculta do fluxo ativo e mantém no Explorar. **Merge** fora de escopo v1.

### Responsáveis

**Um** responsável por unidade (ou nenhum). Filho **não herda** responsável do pai.

Catálogo do projeto: **pessoas** (membros), **IAs** (agentes), **prestadores**, **máquinas** (runtimes). Só itens do catálogo são atribuíveis.

| Tipo | Comportamento |
|------|----------------|
| **Pessoa** | Execução humana |
| **IA** | Executa no board (coluna de execução) e em planos no Gantt; produz/atualiza saídas; estados `pendente` → `em execução` → `concluída` \| `falhou` \| `cancelada`; **retry** só por ação explícita |
| **Prestador de serviço** | Assume, executa e conclui **chamado**; usuário final **aceita** → `atendido` |
| **Máquina** | Linguagem de programação; no **Gantt**: bibliotecas, loops e estados; na **árvore**: procedimento editável (sem exigir paridade total de libs/loops em v1) |

### Glossário

| Termo | Significado |
|-------|-------------|
| **Coluna / raia** | Estágio e faixa do board (quantidade livre) |
| **Coluna de execução** | Dispara IA ao receber card com responsável IA |
| **Chamado** | Card com necessidade e serviço desejado |
| **Entrada / saída** | Artefato de estado: **nome + referência** |
| **Plano** | Contêiner nomeado de tarefas + execução no Gantt |
| **FOP-IR** | Representação intermediária do fluxo para exportação |

## Capacidades

### Board

Configurar colunas e raias; cadastrar, atribuir, mover e aninhar cards; marcar colunas de execução; orquestrar chamados com prestadores.

### Gantt

Visualizar e cadastrar ordens no tempo; entradas/saídas; sequencial/paralelo; aninhar; planos e execução via AIs; FOP; máquina como linguagem; exportar código / linguagem visual unificada.

### Árvore de execução

Floresta (**múltiplas raízes**); criar raiz e filhas; ver responsáveis; hierarquia infinita.

### Explorar

Persistir arquivos; abrir a partir de outras visões; lista ordenada por título com busca; drill-down + caminho (breadcrumb).

## Regras (v1)

### Transversais

- Id canônico UUID; exclusão global; arquivar ≠ excluir; merge fora de escopo.
- Título obrigatório; chamado: + necessidade e serviço.
- Um responsável; sem herança pai→filho; só catálogo do projeto.
- Hierarquia sem ciclos.

### Board

- Remover coluna/raia **bloqueada** se houver cards (esvaziar antes).
- Mover pai move a **subárvore** (pai + descendentes).
- Sem WIP / permissões de caminho em v1: qualquer coluna/raia válida.
- Só **coluna de execução** + responsável **IA** dispara execução automática.
- Chamado visível a **todos os prestadores** do catálogo.
- Prestador conclui → `aguardando aceite`; usuário final aceita → `atendido`.
- Transferência: responsável atual **libera** ou admin **reatribui**.

### Gantt / FOP / IA

- Tarefa pertence a um **plano** (plano padrão do projeto se não informado).
- Datas: **início + fim** (fuso do projeto); duração derivada; sem datas → listada, não posicionada (sinalizada).
- Sequencial = **finish-to-start**.
- Paralelo com dependência sequencial existente → **rejeitar** até remover a dependência.
- Roll-up: pai = min(início)…max(fim) dos filhos com data; estado agrega falha se algum filho falhou.
- Artefato = nome + referência; ligar saídas **opcional**; ciclo de estado bloqueia; órfãos geram **aviso** na exportação.
- Bibliotecas v1: `stdio`, `fs`, `http`; loops: `for`, `while`.
- Exportação: **FOP-IR**; destinos v1: **TypeScript**, **Python**.
- Execução via AIs: só tarefas com responsável IA; **cancelar** → `cancelada`.

### Árvore / Explorar

- Múltiplas raízes permitidas.
- Explorar: ordenação por **título**; busca por título; drill-down + breadcrumb.
