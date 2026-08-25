# Épicos — Plans

Documento espelhado a partir de [`plans/README.md`](../README.md) (contexto e objetivo do produto).

Representação por visão: **card** (board), **tarefa** (Gantt), **atividade/nó** (árvore). Cada um é um **arquivo** na seção **Explorar**.

## EP-01 — Board

- Configurar **colunas** e **raias (swimlanes)** com quantidade livre, conforme o processo do time
- **Cadastrar cards** no fluxo de trabalho
- Representar cada **card** por um **arquivo** na seção **Explorar**
- **Atribuir** responsáveis (**pessoa**, **IA** ou **prestador de serviço**)
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
- Visualizar e atribuir **responsáveis** (**pessoa**, **IA** ou **prestador de serviço**)
- Definir tarefas **sequenciais** (ordem e dependência no tempo)
- Definir tarefas **paralelas** (execução ao mesmo tempo)
- Usar **hierarquia infinita** de tarefas no Gantt
- Utilizar **bibliotecas de programação** no Gantt
- Tratar o Gantt como **representação de uma linguagem de programação**, com:
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
- Atribuir e visualizar **responsáveis** (**pessoa**, **IA** ou **prestador de serviço**)
