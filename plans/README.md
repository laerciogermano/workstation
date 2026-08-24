# Plans

Plans é um sistema de gestão de atividades com **três funcionalidades principais**: board, Gantt e árvore de execução.

## Visão geral

O objetivo do Plans é organizar, acompanhar e visualizar o trabalho de um projeto sem os modelos rígidos de hierarquia comuns em ferramentas tradicionais (épicos, histórias, subtarefas etc.). No Plans, **tudo é tarefa** — e a hierarquia entre tarefas pode crescer de forma **infinita**. Além disso, o Plans atua como **orquestrador de AIs**, permitindo automatizar processos e executar planos.

## Ritmo do Plans

Organizar-se é essencial: precisamos conhecer nossas metas e como chegaremos a elas — definir o **quê** e o **como**.

Isso importa para toda pessoa. Organização dá norte e objetivo: saber para onde se vai, onde se está, o que já foi feito e o que ainda precisa ser feito para alcançar os objetivos.

## As três funcionalidades principais

### 1. Board

Quadro com **colunas** e **raias (swimlanes)** onde as tarefas podem ser:

- **Cadastradas** no fluxo de trabalho
- **Atribuídas** a responsáveis (humano ou IA)
- **Movidas** entre colunas ou raias conforme o andamento
- **Aninhadas** em qualquer profundidade (hierarquia infinita)

Colunas e raias têm quantidade livre, conforme o processo do time e os critérios do projeto. Uma ou mais colunas podem ser marcadas como **colunas de execução**: ao mover uma tarefa para uma delas, se o responsável for uma IA, ela executa o trabalho automaticamente.

### 2. Gantt

Quadro Gantt onde são visualizadas:

- As **ordens** (atividades no tempo)
- As **entradas e saídas** (artefatos de estado dos processos)
- Os **responsáveis** por cada atividade

O Gantt segue o modelo de tarefas com hierarquia infinita e utiliza conceitos do **Flow-Integrated Program**. Nesse paradigma, os elementos se separam em duas substâncias:

1. **Estado** — artefatos de entrada e saída dos processos
2. **Procedimentos** — funções e tarefas

A divisão fundamental é entre **estado** e **função/tarefa**.

### 3. Árvore de execução

Visão em árvore das atividades do projeto, mostrando todas as tarefas que fazem parte da execução e como elas se relacionam hierarquicamente — com **hierarquia infinita**, sem limite de profundidade.

## Conceitos transversais

### Tarefas e hierarquia

- Não existem épicos, histórias ou subtarefas como tipos distintos.
- Todas as unidades de trabalho são **tarefas**.
- Uma tarefa pode conter outras tarefas em qualquer profundidade (**hierarquia infinita**).
- Essa hierarquia vale **no board, no Gantt e na árvore de execução** — as três visões compartilham o mesmo modelo.

### Responsáveis

É possível **atribuir responsáveis** às atividades — no board, no Gantt e na árvore — para deixar claro quem executa cada tarefa. O responsável pode ser:

- uma **pessoa**
- uma **IA**

Quando o responsável é uma IA e a atividade é **movida para uma coluna de execução** no board, a IA realiza o trabalho automaticamente.

### Orquestração de AIs

O Plans também funciona como **orquestrador de AIs**. O gestor pode:

- **Atribuir a IA** como responsável de uma atividade
- **Disparar a execução** ao mover a tarefa para uma coluna de execução
- **Criar planos** por meio do Gantt e executá-los via AIs

Assim, planejamento e execução ficam no mesmo sistema: o humano define o rumo; as AIs ajudam a realizar o trabalho.

## Resumo das capacidades

| Capacidade              | Descrição                                              |
|-------------------------|--------------------------------------------------------|
| Board                   | Colunas e raias; cadastrar, atribuir e mover tarefas   |
| Gantt                   | Ordens, entradas/saídas e responsáveis no tempo        |
| Árvore de execução      | Visão hierárquica de todas as atividades do projeto    |
| Hierarquia infinita     | No board, Gantt e árvore — sem limite de profundidade  |
| Atribuição              | Responsáveis por atividade (humano ou IA)              |
| Coluna de execução      | Ao receber a tarefa, a IA responsável executa o trabalho |
| Modelo unificado        | Somente tarefas — sem épicos, histórias ou subtarefas  |
| Orquestração de AIs     | IA como responsável; execução ao entrar na coluna      |
