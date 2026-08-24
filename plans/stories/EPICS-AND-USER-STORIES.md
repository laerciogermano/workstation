# Épicos e Histórias de Usuário — Plans

Documento de backlog do produto Plans, alinhado à [descrição do projeto](../README.md).

Organiza o desenvolvimento em **épicos** e **histórias de usuário**. No produto em si, o modelo de trabalho permanece unificado: tudo é tarefa, com hierarquia infinita.

**Personas**

| Persona   | Descrição                                      |
|-----------|------------------------------------------------|
| Gestor    | Define metas, planos e orquestra o trabalho    |
| Membro    | Executa e acompanha atividades atribuídas      |
| Observador| Visualiza progresso e árvore do projeto        |

---

## Índice de épicos

| ID    | Épico                                      |
|-------|--------------------------------------------|
| EP-01 | Modelo de tarefas e hierarquia infinita    |
| EP-02 | Boards com colunas e raias                 |
| EP-03 | Gantt e Flow-Integrated Program            |
| EP-04 | Árvore de execução                         |
| EP-05 | Atribuição de responsáveis                 |
| EP-06 | Norte, progresso e ritmo do Plans          |
| EP-07 | Orquestração de AIs                        |

---

## EP-01 — Modelo de tarefas e hierarquia infinita

Permitir que toda unidade de trabalho seja uma **tarefa**, aninhável sem limite de profundidade, sem tipos distintos como épico, história ou subtarefa.

### US-01.01 — Criar tarefa

**Como** gestor,  
**quero** criar uma tarefa no projeto,  
**para** registrar uma unidade de trabalho sem escolher tipos especiais.

**Critérios de aceite**

- É possível criar uma tarefa com título e descrição.
- A tarefa não exige classificação como épico, história ou subtarefa.

### US-01.02 — Aninhar tarefas

**Como** gestor,  
**quero** colocar uma tarefa como filha de outra,  
**para** estruturar o trabalho em qualquer profundidade.

**Critérios de aceite**

- Uma tarefa pode ter zero ou mais tarefas filhas.
- Não há limite de níveis de aninhamento.
- Remover ou mover uma tarefa pai afeta a hierarquia de forma consistente.

### US-01.03 — Mover tarefa na hierarquia

**Como** gestor,  
**quero** reparentar uma tarefa (mudar de pai),  
**para** reorganizar o plano sem recriar o trabalho.

**Critérios de aceite**

- É possível alterar o pai de uma tarefa.
- Ciclos na hierarquia são impedidos.

---

## EP-02 — Boards com colunas e raias

Organizar o fluxo de trabalho em boards com quantidade livre de **colunas** e **raias (swimlanes)**.

### US-02.01 — Criar e configurar board

**Como** gestor,  
**quero** criar um board no projeto,  
**para** visualizar e mover tarefas no fluxo de trabalho.

**Critérios de aceite**

- É possível criar um board associado ao projeto.
- O board exibe tarefas posicionáveis.

### US-02.02 — Colunas em quantidade livre

**Como** gestor,  
**quero** criar, renomear, reordenar e remover colunas,  
**para** refletir o processo do time (ex.: a fazer, fazendo, feito).

**Critérios de aceite**

- Não há limite fixo de colunas.
- Tarefas podem ser movidas entre colunas.

### US-02.03 — Raias em quantidade livre

**Como** gestor,  
**quero** criar, renomear, reordenar e remover raias,  
**para** agrupar tarefas por critérios do projeto (ex.: área, prioridade, time).

**Critérios de aceite**

- Não há limite fixo de raias.
- Tarefas podem ser posicionadas em uma raia (ou nenhuma, se permitido).

### US-02.04 — Mover tarefa no board

**Como** membro,  
**quero** arrastar ou mover uma tarefa entre colunas e raias,  
**para** atualizar o status e o agrupamento do trabalho.

**Critérios de aceite**

- A posição no board é persistida.
- A mudança fica visível para outros usuários do projeto.

---

## EP-03 — Gantt e Flow-Integrated Program

Planejar atividades no tempo com Gantt baseado no **Flow-Integrated Program**, separando **estado** (artefatos de entrada/saída) e **procedimentos** (funções/tarefas).

### US-03.01 — Visualizar plano no Gantt

**Como** gestor,  
**quero** ver as tarefas no eixo do tempo,  
**para** entender duração, sequência e sobreposição do plano.

**Critérios de aceite**

- Tarefas com datas aparecem no Gantt.
- A hierarquia de tarefas é refletida na visualização.

### US-03.02 — Definir datas e duração

**Como** gestor,  
**quero** definir início e fim (ou duração) de uma tarefa,  
**para** montar o cronograma do projeto.

**Critérios de aceite**

- É possível editar datas no Gantt ou no detalhe da tarefa.
- Alterações atualizam a visualização imediatamente.

### US-03.03 — Modelar estado (artefatos)

**Como** gestor,  
**quero** declarar artefatos de entrada e saída de um processo,  
**para** representar o **estado** no Flow-Integrated Program.

**Critérios de aceite**

- É possível associar artefatos de entrada a um procedimento/tarefa.
- É possível associar artefatos de saída a um procedimento/tarefa.
- Artefatos são distinguíveis de procedimentos na interface.

### US-03.04 — Modelar procedimentos (funções/tarefas)

**Como** gestor,  
**quero** definir procedimentos que transformam estado,  
**para** representar a divisão entre estado e função/tarefa.

**Critérios de aceite**

- Procedimentos ligam-se a estados de entrada e saída.
- O Gantt permite enxergar essa relação no plano.

### US-03.05 — Criar plano completo no Gantt

**Como** gestor,  
**quero** montar um plano executável no Gantt,  
**para** definir o **como** chegaremos às metas.

**Critérios de aceite**

- O plano agrupa tarefas, estados e procedimentos no tempo.
- O plano pode ser referenciado para execução (humana ou via AI).

---

## EP-04 — Árvore de execução

Visualizar todas as atividades do projeto em uma **árvore de execução**.

### US-04.01 — Ver árvore do projeto

**Como** observador,  
**quero** abrir a árvore de execução do projeto,  
**para** ver todas as atividades e como se relacionam hierarquicamente.

**Critérios de aceite**

- A árvore lista todas as tarefas do projeto.
- Expansão/colapso de nós funciona em qualquer profundidade.

### US-04.02 — Navegar da árvore para o detalhe

**Como** membro,  
**quero** selecionar um nó da árvore e abrir a tarefa,  
**para** ver detalhes, responsáveis e status.

**Critérios de aceite**

- Clicar em um nó abre o detalhe da tarefa.
- O caminho hierárquico permanece claro (breadcrumb ou equivalente).

---

## EP-05 — Atribuição de responsáveis

Atribuir pessoas às atividades para deixar claro quem executa cada tarefa.

### US-05.01 — Atribuir responsável

**Como** gestor,  
**quero** atribuir um ou mais responsáveis a uma tarefa,  
**para** definir quem conduz a execução.

**Critérios de aceite**

- É possível atribuir e remover responsáveis.
- A atribuição aparece no board, Gantt e árvore (conforme aplicável).

### US-05.02 — Ver minhas atividades

**Como** membro,  
**quero** filtrar ou listar tarefas atribuídas a mim,  
**para** saber o que preciso fazer.

**Critérios de aceite**

- Existe filtro ou visão “minhas tarefas”.
- A lista reflete atribuições atuais.

---

## EP-06 — Norte, progresso e ritmo do Plans

Apoiar a organização pessoal e do time: metas (**quê**), caminho (**como**), posição atual, o que já foi feito e o que ainda falta.

### US-06.01 — Definir metas do projeto

**Como** gestor,  
**quero** registrar as metas do projeto,  
**para** ter norte e objetivo claros.

**Critérios de aceite**

- É possível criar e editar metas.
- Metas podem ser vinculadas a tarefas ou planos do Gantt.

### US-06.02 — Ver onde estou no plano

**Como** membro,  
**quero** visualizar o progresso em relação às metas,  
**para** saber onde estou e para onde estou indo.

**Critérios de aceite**

- Há indicação de progresso (ex.: concluído vs. restante).
- É possível distinguir o que já foi feito do que ainda falta.

### US-06.03 — Revisar o que falta para o objetivo

**Como** gestor,  
**quero** listar o trabalho restante ligado a uma meta,  
**para** saber o que ainda precisa ser feito.

**Critérios de aceite**

- Tarefas pendentes vinculadas à meta são listadas.
- Itens concluídos podem ser separados ou ocultados.

---

## EP-07 — Orquestração de AIs

Permitir que o gestor automatize processos do board, crie planos no Gantt e os execute por meio de AIs.

### US-07.01 — Automatizar processos do board

**Como** gestor,  
**quero** configurar automações no board (ex.: mover tarefa, notificar, disparar ação),  
**para** reduzir trabalho manual no fluxo.

**Critérios de aceite**

- É possível criar regras ligadas a eventos do board.
- A automação pode invocar uma AI quando configurado.

### US-07.02 — Executar plano do Gantt via AI

**Como** gestor,  
**quero** disparar a execução de um plano do Gantt por AIs,  
**para** realizar procedimentos planejados com orquestração automática.

**Critérios de aceite**

- Um plano do Gantt pode ser marcado para execução via AI.
- O status da execução fica visível (em andamento, concluído, falha).

### US-07.03 — Acompanhar orquestração

**Como** gestor,  
**quero** acompanhar o que cada AI executou no plano,  
**para** manter controle humano sobre o rumo e o resultado.

**Critérios de aceite**

- Há histórico ou log de execução por tarefa/procedimento.
- É possível interromper ou retomar a orquestração.

### US-07.04 — Planejar com AI e executar com AI

**Como** gestor,  
**quero** usar AIs tanto para ajudar a montar o plano no Gantt quanto para executá-lo,  
**para** unir planejamento e execução no mesmo sistema.

**Critérios de aceite**

- Há fluxo para sugerir/criar plano com apoio de AI.
- O plano gerado ou ajustado pode ser executado via orquestração de AIs.

---

## Rastreabilidade com a descrição do projeto

| Capacidade no README                         | Épico(s)   |
|----------------------------------------------|------------|
| Modelo unificado / hierarquia infinita       | EP-01      |
| Boards, colunas e raias                      | EP-02      |
| Gantt e Flow-Integrated Program              | EP-03      |
| Árvore de execução                           | EP-04      |
| Atribuição de responsáveis                   | EP-05      |
| Ritmo do Plans (metas, norte, progresso)     | EP-06      |
| Orquestração de AIs                          | EP-07      |
