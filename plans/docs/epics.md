# Épicos — Plans

Documento espelhado a partir de [`plans/README.md`](../README.md) (contexto e objetivo do produto).

## EP-01 — Board

- Configurar **colunas** e **raias (swimlanes)** com quantidade livre, conforme o processo do time
- **Cadastrar** tarefas no fluxo de trabalho
- **Atribuir** responsáveis (**pessoa**, **IA** ou **prestador de serviço**)
- **Mover** tarefas entre colunas e raias conforme o andamento
- **Aninhar** tarefas em qualquer profundidade (**hierarquia infinita**; tudo é tarefa)
- Marcar uma ou mais **colunas de execução**
- **Orquestrar AIs**: ao mover uma tarefa para coluna de execução, se o responsável for uma IA, ela executa o trabalho automaticamente
- Criar **card (chamado)** descrevendo a necessidade e o serviço desejado
- **Orquestrar prestadores de serviços**: prestador assume a responsabilidade, executa a atividade e atende a necessidade do usuário final

## EP-02 — Gantt

- Visualizar **ordens** (atividades no tempo)
- Visualizar **entradas e saídas** (artefatos de estado dos processos)
- Visualizar e atribuir **responsáveis** (**pessoa**, **IA** ou **prestador de serviço**)
- Definir atividades **sequenciais** (ordem e dependência no tempo)
- Definir atividades **paralelas** (execução ao mesmo tempo)
- Usar **hierarquia infinita** de tarefas no Gantt
- Aplicar o modelo **Flow-Integrated Program**:
  - **Estado** — artefatos de entrada e saída dos processos
  - **Procedimentos** — funções e tarefas
- **Criar planos** no Gantt
- **Orquestrar AIs**: executar planos via AIs (humano define o rumo; AIs ajudam a realizar o trabalho)

## EP-03 — Árvore de execução

- Visualizar em árvore todas as tarefas da execução
- Navegar o relacionamento hierárquico entre tarefas
- Tratar **tudo como tarefa** (sem tipos distintos de épico, história ou subtarefa)
- **Criar atividades filhas** a partir de qualquer tarefa
- Decompor o trabalho com **hierarquia infinita** (sem limite de profundidade)
- Atribuir e visualizar **responsáveis** (**pessoa**, **IA** ou **prestador de serviço**)
