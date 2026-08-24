# Épicos — Plans

Épicos das **três funcionalidades principais** do Plans: board, Gantt e árvore de execução.

Conceitos transversais (tarefa única com hierarquia infinita, responsáveis humano/IA e orquestração de AIs) fazem parte do escopo dessas funcionalidades — não são épicos à parte.

---

## EP-01 — Board

**Objetivo:** Organizar o trabalho em um quadro com colunas e raias (swimlanes).

**Escopo:**
- Colunas e raias com quantidade livre, conforme o processo do time
- Cadastro de tarefas no fluxo
- Atribuição de responsáveis (pessoa ou IA)
- Movimentação entre colunas e raias
- Aninhamento de tarefas em qualquer profundidade (hierarquia infinita)
- Uma ou mais **colunas de execução**: ao mover uma tarefa para elas, se o responsável for uma IA, ela executa o trabalho automaticamente

**Critérios de sucesso:**
- Tarefas podem ser cadastradas, atribuídas, movidas e aninhadas no board
- Colunas de execução disparam a IA quando ela é a responsável

---

## EP-02 — Gantt

**Objetivo:** Visualizar e planejar atividades no tempo, com entradas, saídas e responsáveis.

**Escopo:**
- Visualização das **ordens** (atividades no tempo)
- **Entradas e saídas** (artefatos de estado dos processos)
- **Responsáveis** por cada atividade (pessoa ou IA)
- Hierarquia infinita de tarefas no Gantt
- Modelo Flow-Integrated Program: **estado** (artefatos) e **procedimentos** (funções/tarefas)
- Criação de planos no Gantt para execução via AIs

**Critérios de sucesso:**
- Usuário vê ordens, artefatos de estado e responsáveis no eixo temporal
- Planos criados no Gantt podem ser executados por AIs

---

## EP-03 — Árvore de execução

**Objetivo:** Mostrar as atividades do projeto e como se relacionam hierarquicamente.

**Escopo:**
- Visão em árvore de todas as tarefas da execução
- Hierarquia infinita (sem limite de profundidade)
- Relacionamento entre tarefas pai e filhas
- Atribuição/visualização de responsáveis (pessoa ou IA) na árvore

**Critérios de sucesso:**
- Toda a estrutura de execução é navegável em árvore
- A hierarquia infinita é suportada sem tipos distintos de trabalho (tudo é tarefa)
