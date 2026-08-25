# Épicos — Plans

Épicos que contemplam as funcionalidades descritas em [`plans/README.md`](../README.md).

Histórias: [`stories/`](stories/) · Técnico: [`tech/`](tech/) · Índice da esteira: [`README.md`](README.md)

| ID | Épico | Histórias |
|----|-------|-----------|
| EP-01 | Board | [`stories/ep-01-board/`](stories/ep-01-board/) |
| EP-02 | Gantt | [`stories/ep-02-gantt/`](stories/ep-02-gantt/) |
| EP-03 | Árvore de execução | [`stories/ep-03-arvore/`](stories/ep-03-arvore/) |
| EP-04 | Explorar | [`stories/ep-04-explorar/`](stories/ep-04-explorar/) |

---

## EP-01 — Board

- Configurar **colunas** e **raias (swimlanes)** com quantidade livre, conforme o processo do time
- **Cadastrar cards** no fluxo de trabalho
- Representar cada **card** como a mesma unidade de trabalho (**arquivo** / **tarefa** / **nó** / **card**)
- **Atribuir** responsáveis (**pessoa**, **IA**, **prestador de serviço** ou **máquina**)
- **Mover** cards entre colunas e raias conforme o andamento
- **Aninhar** cards em qualquer profundidade (**hierarquia infinita**)
- Marcar uma ou mais **colunas de execução**
- **Orquestrar AIs**: ao mover um card para coluna de execução, se o responsável for uma IA, ela executa o trabalho automaticamente
- Criar **card (chamado)** descrevendo a necessidade e o serviço desejado
- **Orquestrar prestadores de serviços**: prestador assume a responsabilidade, executa e atende a necessidade do usuário final

## EP-02 — Gantt

- Visualizar **ordens** (**tarefas** no tempo)
- Visualizar **entradas e saídas** (artefatos de **estado** dos processos)
- Representar cada **tarefa** como a mesma unidade de trabalho (**arquivo** / **tarefa** / **nó** / **card**)
- Visualizar e atribuir **responsáveis** (**pessoa**, **IA**, **prestador de serviço** ou **máquina**)
- Definir tarefas **sequenciais** (ordem e dependência no tempo)
- Definir tarefas **paralelas** (execução ao mesmo tempo)
- Usar **hierarquia infinita** de tarefas no Gantt
- **Criar planos** no Gantt
- **Orquestrar AIs**: executar planos via AIs (humano define o rumo; AIs ajudam a realizar o trabalho)
- Aplicar **Flow Oriented Programming**:
  - **Estado** — entradas e saídas dos processos
  - **Procedimentos** — funções e tarefas
- Se o responsável for **máquina**, tratar o Gantt / a tarefa como **linguagem de programação**, com:
  - uso de **bibliotecas de programação**
  - **laços de repetição** / **loops**
  - **estados**, expressos como **entradas e saídas**
- **Exportar o Gantt como código** e utilizá-lo como código, seguindo **Flow Oriented Programming**
- Suportar a visão de **linguagem visual** unificada: compilação em uma só linguagem e exportação para demais linguagens (estrutura unificada de desenvolvimento)

## EP-03 — Árvore de execução

- Visualizar em árvore todas as **atividades** (**nós**) da execução
- Representar cada **nó** como a mesma unidade de trabalho (**arquivo** / **tarefa** / **nó** / **card**)
- Navegar o relacionamento hierárquico entre nós
- **Criar atividades filhas** (nós filhos) a partir de qualquer atividade
- Decompor o trabalho com **hierarquia infinita** (sem limite de profundidade)
- Atribuir e visualizar **responsáveis** (**pessoa**, **IA**, **prestador de serviço** ou **máquina**)
- Se o responsável for **máquina**, tratar a **atividade** como **linguagem de programação**

## EP-04 — Explorar

- Persistir toda atividade como **arquivo** na seção **Explorar**
- Disponibilizar **explorador de arquivos em lista**
- Permitir **navegação por profundidade** (hierarquia infinita)
- Expor a mesma unidade independentemente da visão de origem (**card**, **tarefa** ou **nó**)
