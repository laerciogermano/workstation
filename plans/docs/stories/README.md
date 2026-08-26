# User stories — Plans

Histórias de usuário identificadas a partir de [`plans/README.md`](../../README.md), no formato abstrato.

---

## Unidade de trabalho

**US-01 — Mesma unidade de trabalho**  
Como **usuário**, quero **tratar toda atividade como a mesma unidade de trabalho** (card, tarefa, nó ou arquivo), para **organizar o projeto sem fragmentar o modelo mental entre visões**.

**US-02 — Vocabulário por visão**  
Como **usuário**, quero **nomear a unidade conforme a visão em uso**, para **trabalhar no vocabulário natural de cada superfície** (board, Gantt, árvore ou Explorar).

## Responsáveis

**US-03 — Responsável pessoa**  
Como **usuário**, quero **atribuir uma pessoa como responsável de uma unidade**, para **deixar claro quem executa o trabalho humano**.

**US-04 — Responsável IA**  
Como **usuário**, quero **atribuir uma IA como responsável de uma unidade**, para **delegar execução automática quando couber**.

**US-05 — Responsável prestador**  
Como **usuário**, quero **atribuir um prestador de serviço como responsável de uma unidade**, para **intermediar necessidades do usuário final a quem presta o serviço**.

**US-06 — Responsável máquina**  
Como **usuário**, quero **atribuir uma máquina como responsável de uma unidade**, para **tratar o trabalho como linguagem de programação executável**.

## Board

**US-07 — Configurar colunas**  
Como **membro do time**, quero **configurar colunas em quantidade livre**, para **refletir o processo de trabalho do time**.

**US-08 — Configurar raias**  
Como **membro do time**, quero **configurar raias (swimlanes) em quantidade livre**, para **organizar o quadro conforme o processo do time**.

**US-09 — Cadastrar cards**  
Como **usuário**, quero **cadastrar cards no board**, para **registrar unidades de trabalho no fluxo**.

**US-10 — Atribuir responsáveis no board**  
Como **usuário**, quero **atribuir responsáveis a cards**, para **definir quem (pessoa, IA, prestador ou máquina) conduz cada item**.

**US-11 — Mover cards**  
Como **usuário**, quero **mover cards entre colunas e raias**, para **acompanhar o andamento do trabalho**.

**US-12 — Aninhar cards**  
Como **usuário**, quero **aninhar cards em qualquer profundidade**, para **decompor o trabalho com hierarquia infinita**.

**US-13 — Colunas de execução**  
Como **usuário**, quero **marcar uma ou mais colunas como colunas de execução**, para **disparar trabalho automático ao mover cards para elas**.

**US-14 — Orquestrar IA no board**  
Como **usuário**, quero **que uma IA execute automaticamente o trabalho ao mover um card para coluna de execução quando ela for a responsável**, para **orquestrar AIs pelo board**.

**US-15 — Criar chamado**  
Como **usuário final**, quero **criar um card (chamado) descrevendo a necessidade e o serviço desejado**, para **solicitar atendimento por prestadores**.

**US-16 — Atender chamado**  
Como **prestador de serviço**, quero **assumir a responsabilidade de um chamado, executá-lo e atender a necessidade**, para **fechar a orquestração entre usuário final e serviço**.

## Gantt

**US-17 — Visualizar ordens no tempo**  
Como **usuário**, quero **visualizar tarefas (ordens) no tempo**, para **acompanhar o planejamento temporal do projeto**.

**US-18 — Entradas e saídas**  
Como **usuário**, quero **visualizar entradas e saídas (artefatos de estado) das tarefas**, para **entender o fluxo de estado entre procedimentos**.

**US-19 — Responsáveis no Gantt**  
Como **usuário**, quero **atribuir e visualizar responsáveis nas tarefas do Gantt**, para **saber quem conduz cada ordem**.

**US-20 — Tarefas sequenciais**  
Como **usuário**, quero **definir tarefas sequenciais**, para **expressar ordem e dependência no tempo**.

**US-21 — Tarefas paralelas**  
Como **usuário**, quero **definir tarefas paralelas**, para **expressar execução simultânea**.

**US-22 — Aninhar tarefas no Gantt**  
Como **usuário**, quero **aninhar tarefas em qualquer profundidade no Gantt**, para **planejar com hierarquia infinita**.

**US-23 — Criar planos**  
Como **usuário**, quero **criar planos no Gantt**, para **organizar trabalho executável no tempo**.

**US-24 — Executar planos via AIs**  
Como **usuário**, quero **executar planos via AIs**, para **realizar o trabalho com orquestração de inteligência artificial**.

**US-25 — Flow Oriented Programming**  
Como **usuário**, quero **aplicar Flow Oriented Programming no Gantt** (estado e procedimentos), para **modelar o plano como fluxo de entradas, saídas e funções**.

**US-26 — Máquina como linguagem no Gantt**  
Como **usuário**, quero **tratar tarefa com responsável máquina como linguagem de programação**, para **usar bibliotecas, laços e estados (entradas e saídas) no plano**.

**US-27 — Exportar Gantt como código**  
Como **usuário**, quero **exportar o Gantt como código**, para **utilizar o plano como programa no paradigma de Flow Oriented Programming**.

**US-28 — Linguagem visual unificada**  
Como **usuário**, quero **trabalhar com uma linguagem visual unificada que compile e exporte para outras linguagens**, para **desenvolver de forma redundante em múltiplas linguagens a partir de uma estrutura única**.

## Árvore de execução

**US-29 — Visualizar árvore**  
Como **usuário**, quero **visualizar as atividades (nós) em árvore**, para **entender a estrutura hierárquica da execução**.

**US-30 — Criar atividades filhas**  
Como **usuário**, quero **criar atividades filhas a partir de qualquer atividade**, para **decompor o trabalho na árvore**.

**US-31 — Hierarquia infinita na árvore**  
Como **usuário**, quero **relacionar atividades em hierarquia infinita**, para **refinar a execução sem limite de profundidade**.

**US-32 — Responsáveis na árvore**  
Como **usuário**, quero **atribuir e visualizar responsáveis na árvore**, para **saber quem (pessoa, IA, prestador ou máquina) conduz cada nó**.

**US-33 — Máquina como linguagem na árvore**  
Como **usuário**, quero **tratar atividade com responsável máquina como linguagem de programação**, para **executar nós como procedimentos programáveis**.

## Explorar

**US-34 — Persistir como arquivo**  
Como **usuário**, quero **persistir toda unidade de trabalho como arquivo**, para **ter representação estável e explorável do trabalho**.

**US-35 — Explorador em lista**  
Como **usuário**, quero **explorar unidades em lista na seção Explorar**, para **navegar o projeto como arquivos**.

**US-36 — Navegação por profundidade**  
Como **usuário**, quero **navegar por profundidade no explorador**, para **percorrer a hierarquia infinita das unidades**.
