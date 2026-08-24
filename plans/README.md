# Plans

Plans é um sistema de gestão de atividades baseado em **boards** e **quadros Gantt**.

## Visão geral

O objetivo do Plans é organizar, acompanhar e visualizar o trabalho de um projeto sem os modelos rígidos de hierarquia comuns em ferramentas tradicionais (épicos, histórias, subtarefas etc.). No Plans, **tudo é tarefa** — e a hierarquia entre tarefas pode crescer de forma **infinita**.

## Conceitos principais

### Tarefas e hierarquia

- Não existem épicos, histórias ou subtarefas como tipos distintos.
- Todas as unidades de trabalho são **tarefas**.
- Uma tarefa pode conter outras tarefas em qualquer profundidade (hierarquia infinita).

### Boards

Os boards permitem organizar o fluxo de trabalho com:

- **Colunas** — quantidade livre, conforme o processo do time
- **Raias (swimlanes)** — quantidade livre, para agrupar tarefas por critérios do projeto

### Gantt

O quadro Gantt do Plans:

- Representa as atividades no tempo
- Segue o mesmo modelo de tarefas com hierarquia infinita
- Utiliza conceitos do paradigma **flow-oriented programming** para modelar o fluxo e as dependências entre atividades

### Árvore de execução

Além do board e do Gantt, o projeto pode ser visualizado como uma **árvore de execução**, mostrando todas as atividades que fazem parte do projeto e como elas se relacionam hierarquicamente.

### Responsáveis

É possível **atribuir responsáveis** às atividades, para deixar claro quem executa cada tarefa.

## Resumo das capacidades

| Capacidade              | Descrição                                              |
|-------------------------|--------------------------------------------------------|
| Boards                  | Organização em colunas e raias configuráveis           |
| Gantt                   | Planejamento temporal com flow-oriented programming    |
| Árvore de execução      | Visão hierárquica de todas as atividades do projeto    |
| Hierarquia infinita     | Tarefas aninhadas sem limite de profundidade           |
| Atribuição              | Responsáveis por atividade                             |
| Modelo unificado        | Somente tarefas — sem épicos, histórias ou subtarefas  |
