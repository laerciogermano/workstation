# Plans

## Contexto

Organizar-se é essencial: precisamos conhecer nossas metas e como chegaremos a elas — definir o **quê** e o **como**.

Isso importa para toda pessoa. Organização dá norte e objetivo: saber para onde se vai, onde se está, o que já foi feito e o que ainda precisa ser feito para alcançar os objetivos.

Ferramentas tradicionais de gestão de trabalho costumam impor modelos rígidos de hierarquia (épicos, histórias, subtarefas etc.). O Plans parte de outro princípio: a unidade de trabalho é uma só e a hierarquia pode crescer de forma **infinita**.

Há também o objetivo de **desenvolver sistemas utilizando diferentes linguagens** de forma redundante. Com **Flow Oriented Programming**, uma **linguagem visual** reúne a compilação de todas as linguagens em **uma só linguagem**, que pode ser **exportada para as demais** — uma **estrutura unificada de desenvolvimento de software**.

No Plans, **toda atividade é arquivo, tarefa, nó ou card** — a mesma unidade, nomeada conforme a visão:

- no **board**, como **card**
- no **Gantt**, como **tarefa**
- na **árvore de execução**, como **atividade** (**nó**)
- na seção **Explorar**, como **arquivo**

Por isso deve existir um **explorador de arquivos em lista**, com **navegação por profundidade**, na seção **Explorar**.

## Objetivo

Organizar, acompanhar e visualizar o trabalho de um projeto por meio de **três funcionalidades principais** — board, Gantt e árvore de execução — permitindo atribuir responsáveis (**pessoa**, **IA**, **prestador de serviço** ou **máquina**), orquestrar AIs e intermediar necessidades do usuário final a prestadores de serviços. Toda atividade é **arquivo**, **tarefa**, **nó** ou **card** e é navegável no **explorador de arquivos em lista** (seção **Explorar**), com **navegação por profundidade**. Quando a responsabilidade for **máquina**, o **Gantt** / a **atividade** deve ser tratado como **linguagem de programação**.

## Épicos

### EP-01 — Board

- Configurar **colunas** e **raias (swimlanes)** com quantidade livre, conforme o processo do time
- **Cadastrar cards** no fluxo de trabalho
- Representar cada **card** por um **arquivo** na seção **Explorar**
- Navegar cards no **explorador de arquivos em lista**, com **navegação por profundidade**
- **Atribuir** responsáveis (**pessoa**, **IA**, **prestador de serviço** ou **máquina**)
- **Mover** cards entre colunas e raias conforme o andamento
- **Aninhar** cards em qualquer profundidade (**hierarquia infinita**)
- Marcar uma ou mais **colunas de execução**
- **Orquestrar AIs**: ao mover um card para coluna de execução, se o responsável for uma IA, ela executa o trabalho automaticamente
- Criar **card (chamado)** descrevendo a necessidade e o serviço desejado
- **Orquestrar prestadores de serviços**: prestador assume a responsabilidade, executa e atende a necessidade do usuário final

### EP-02 — Gantt

- Visualizar **ordens** (**tarefas** no tempo)
- Visualizar **entradas e saídas** (artefatos de **estado** dos processos)
- Representar cada **tarefa** por um **arquivo** na seção **Explorar**
- Navegar tarefas no **explorador de arquivos em lista**, com **navegação por profundidade**
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

### EP-03 — Árvore de execução

- Visualizar em árvore todas as **atividades** (**nós**) da execução
- Representar cada **nó** por um **arquivo** na seção **Explorar**
- Navegar atividades no **explorador de arquivos em lista**, com **navegação por profundidade**
- Navegar o relacionamento hierárquico entre nós
- **Criar atividades filhas** (nós filhos) a partir de qualquer atividade
- Decompor o trabalho com **hierarquia infinita** (sem limite de profundidade)
- Atribuir e visualizar **responsáveis** (**pessoa**, **IA**, **prestador de serviço** ou **máquina**)
- Se o responsável for **máquina**, tratar a **atividade** como **linguagem de programação**
