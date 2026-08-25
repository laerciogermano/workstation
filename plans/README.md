# Plans

Definições **de negócio** do produto. Épicos, histórias e refinamento técnico ficam em [`docs/`](docs/).

## Esteira de documentação

```text
README (este arquivo) → docs/epics.md → docs/stories/ → docs/tech/
```

Detalhes: [`docs/README.md`](docs/README.md).

## Contexto

Organizar-se é essencial: precisamos conhecer nossas metas e como chegaremos a elas — definir o **quê** e o **como**.

Isso importa para toda pessoa. Organização dá norte e objetivo: saber para onde se vai, onde se está, o que já foi feito e o que ainda precisa ser feito para alcançar os objetivos.

Ferramentas tradicionais de gestão de trabalho costumam impor modelos rígidos de hierarquia (épicos, histórias, subtarefas etc.). O Plans parte de outro princípio: a unidade de trabalho é uma só e a hierarquia pode crescer de forma **infinita**.

Há também o objetivo de **desenvolver sistemas utilizando diferentes linguagens** de forma redundante. Com **Flow Oriented Programming**, uma **linguagem visual** reúne a compilação de todas as linguagens em **uma só linguagem**, que pode ser **exportada para as demais** — uma **estrutura unificada de desenvolvimento de software**.

## Objetivo

Organizar, acompanhar e visualizar o trabalho de um projeto por meio de **três funcionalidades principais** — **board**, **Gantt** e **árvore de execução** — permitindo atribuir responsáveis, orquestrar AIs, intermediar necessidades do usuário final a prestadores de serviços e, quando couber, tratar planos como linguagem de programação exportável.

## Definições

### Unidade de trabalho

**Toda atividade é arquivo, tarefa, nó ou card** — a mesma unidade, nomeada conforme a visão:

| Visão | Nome |
|-------|------|
| Board | **card** |
| Gantt | **tarefa** |
| Árvore de execução | **atividade** (**nó**) |
| Explorar | **arquivo** |

### Responsáveis

Uma unidade pode ter como responsável:

- **pessoa**
- **IA**
- **prestador de serviço**
- **máquina**

Quando o responsável for **máquina**, o **Gantt** / a **atividade** deve ser tratado como **linguagem de programação**.

### Explorar

Toda unidade persiste como **arquivo**. Deve existir um **explorador de arquivos em lista**, com **navegação por profundidade**, na seção **Explorar**.

## Funcionalidades principais

### Board

Quadro com **colunas** e **raias (swimlanes)** de quantidade livre, conforme o processo do time, onde **cards** podem ser cadastrados, atribuídos, movidos e aninhados em qualquer profundidade (**hierarquia infinita**).

Uma ou mais colunas podem ser **colunas de execução**: ao mover um card para elas, se o responsável for uma **IA**, a IA executa o trabalho automaticamente.

O board também orquestra **prestadores de serviços**: o usuário cria um **card (chamado)** descrevendo a necessidade e o serviço desejado; um prestador assume a responsabilidade, executa e atende a necessidade do usuário final.

### Gantt

Visão temporal das **tarefas** (**ordens**), com **entradas e saídas** (artefatos de **estado**), responsáveis e suporte a tarefas **sequenciais** ou **paralelas**, com **hierarquia infinita**.

O Gantt aplica **Flow Oriented Programming** — **estado** (entradas e saídas) e **procedimentos** (funções e tarefas). Nele é possível criar planos e executá-los via **AIs**.

Quando o responsável for **máquina**, o Gantt / a tarefa é tratado como **linguagem de programação**, com **bibliotecas de programação**, **laços de repetição** / **loops** e **estados** como entradas e saídas. O Gantt pode ser **exportado como código** e utilizado como código nesse paradigma.

### Árvore de execução

Visão em árvore das **atividades** (**nós**) da execução, com criação de **atividades filhas**, relacionamento hierárquico e **hierarquia infinita** (sem limite de profundidade).

Responsáveis (**pessoa**, **IA**, **prestador de serviço** ou **máquina**) podem ser atribuídos e visualizados. Se o responsável for **máquina**, a **atividade** é tratada como **linguagem de programação**.
