# Épicos — Plans

Documento espelhado a partir de [`plans/README.md`](../README.md) (contexto e objetivo do produto).

Representação por visão: **card** (board), **tarefa** (Gantt), **atividade/nó** (árvore). Cada um é um **arquivo** na seção **Explorar**. Responsáveis: **pessoa**, **IA**, **prestador de serviço** ou **máquina**. Se o responsável for **máquina**, o Gantt / a atividade é tratado como **linguagem de programação**.

## EP-01 — Board

- Configurar **colunas** e **raias (swimlanes)** com quantidade livre, conforme o processo do time
- **Cadastrar cards** no fluxo de trabalho
- Representar cada **card** por um **arquivo** na seção **Explorar**
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
- Representar cada **tarefa** por um **arquivo** na seção **Explorar**
- Visualizar e atribuir **responsáveis** (**pessoa**, **IA**, **prestador de serviço** ou **máquina**)
- Definir tarefas **sequenciais** (ordem e dependência no tempo)
- Definir tarefas **paralelas** (execução ao mesmo tempo)
- Usar **hierarquia infinita** de tarefas no Gantt
- Se o responsável for **máquina**, tratar o Gantt / a tarefa como **linguagem de programação**, com:
  - uso de **bibliotecas de programação**
  - **laços de repetição** / **loops**
  - **estados**, expressos como **entradas e saídas**
- Aplicar o conceito de **Flow Oriented Programming**:
  - **Estado** — entradas e saídas dos processos
  - **Procedimentos** — funções e tarefas
- **Criar planos** no Gantt
- **Orquestrar AIs**: executar planos via AIs (humano define o rumo; AIs ajudam a realizar o trabalho)
- **Exportar o Gantt como código** e utilizá-lo como código, seguindo **Flow Oriented Programming**

## EP-03 — Árvore de execução

- Visualizar em árvore todas as **atividades** (**nós**) da execução
- Representar cada **nó** por um **arquivo** na seção **Explorar**
- Navegar o relacionamento hierárquico entre nós
- **Criar atividades filhas** (nós filhos) a partir de qualquer atividade
- Decompor o trabalho com **hierarquia infinita** (sem limite de profundidade)
- Atribuir e visualizar **responsáveis** (**pessoa**, **IA**, **prestador de serviço** ou **máquina**)
- Se o responsável for **máquina**, tratar a **atividade** como **linguagem de programação**
