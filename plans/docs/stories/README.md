# User stories — Plans

Histórias de usuário identificadas a partir de [`plans/README.md`](../../README.md), no formato abstrato.

---

## Unidade de trabalho

1. Como **usuário**, quero **tratar toda atividade como a mesma unidade de trabalho** (card, tarefa, nó ou arquivo), para **organizar o projeto sem fragmentar o modelo mental entre visões**.

2. Como **usuário**, quero **nomear a unidade conforme a visão em uso**, para **trabalhar no vocabulário natural de cada superfície** (board, Gantt, árvore ou Explorar).

## Responsáveis

3. Como **usuário**, quero **atribuir uma pessoa como responsável de uma unidade**, para **deixar claro quem executa o trabalho humano**.

4. Como **usuário**, quero **atribuir uma IA como responsável de uma unidade**, para **delegar execução automática quando couber**.

5. Como **usuário**, quero **atribuir um prestador de serviço como responsável de uma unidade**, para **intermediar necessidades do usuário final a quem presta o serviço**.

6. Como **usuário**, quero **atribuir uma máquina como responsável de uma unidade**, para **tratar o trabalho como linguagem de programação executável**.

## Board

7. Como **membro do time**, quero **configurar colunas em quantidade livre**, para **refletir o processo de trabalho do time**.

8. Como **membro do time**, quero **configurar raias (swimlanes) em quantidade livre**, para **organizar o quadro conforme o processo do time**.

9. Como **usuário**, quero **cadastrar cards no board**, para **registrar unidades de trabalho no fluxo**.

10. Como **usuário**, quero **atribuir responsáveis a cards**, para **definir quem (pessoa, IA, prestador ou máquina) conduz cada item**.

11. Como **usuário**, quero **mover cards entre colunas e raias**, para **acompanhar o andamento do trabalho**.

12. Como **usuário**, quero **aninhar cards em qualquer profundidade**, para **decompor o trabalho com hierarquia infinita**.

13. Como **usuário**, quero **marcar uma ou mais colunas como colunas de execução**, para **disparar trabalho automático ao mover cards para elas**.

14. Como **usuário**, quero **que uma IA execute automaticamente o trabalho ao mover um card para coluna de execução quando ela for a responsável**, para **orquestrar AIs pelo board**.

15. Como **usuário final**, quero **criar um card (chamado) descrevendo a necessidade e o serviço desejado**, para **solicitar atendimento por prestadores**.

16. Como **prestador de serviço**, quero **assumir a responsabilidade de um chamado, executá-lo e atender a necessidade**, para **fechar a orquestração entre usuário final e serviço**.

## Gantt

17. Como **usuário**, quero **visualizar tarefas (ordens) no tempo**, para **acompanhar o planejamento temporal do projeto**.

18. Como **usuário**, quero **visualizar entradas e saídas (artefatos de estado) das tarefas**, para **entender o fluxo de estado entre procedimentos**.

19. Como **usuário**, quero **atribuir e visualizar responsáveis nas tarefas do Gantt**, para **saber quem conduz cada ordem**.

20. Como **usuário**, quero **definir tarefas sequenciais**, para **expressar ordem e dependência no tempo**.

21. Como **usuário**, quero **definir tarefas paralelas**, para **expressar execução simultânea**.

22. Como **usuário**, quero **aninhar tarefas em qualquer profundidade no Gantt**, para **planejar com hierarquia infinita**.

23. Como **usuário**, quero **criar planos no Gantt**, para **organizar trabalho executável no tempo**.

24. Como **usuário**, quero **executar planos via AIs**, para **realizar o trabalho com orquestração de inteligência artificial**.

25. Como **usuário**, quero **aplicar Flow Oriented Programming no Gantt** (estado e procedimentos), para **modelar o plano como fluxo de entradas, saídas e funções**.

26. Como **usuário**, quero **tratar tarefa com responsável máquina como linguagem de programação**, para **usar bibliotecas, laços e estados (entradas e saídas) no plano**.

27. Como **usuário**, quero **exportar o Gantt como código**, para **utilizar o plano como programa no paradigma de Flow Oriented Programming**.

28. Como **usuário**, quero **trabalhar com uma linguagem visual unificada que compile e exporte para outras linguagens**, para **desenvolver de forma redundante em múltiplas linguagens a partir de uma estrutura única**.

## Árvore de execução

29. Como **usuário**, quero **visualizar as atividades (nós) em árvore**, para **entender a estrutura hierárquica da execução**.

30. Como **usuário**, quero **criar atividades filhas a partir de qualquer atividade**, para **decompor o trabalho na árvore**.

31. Como **usuário**, quero **relacionar atividades em hierarquia infinita**, para **refinar a execução sem limite de profundidade**.

32. Como **usuário**, quero **atribuir e visualizar responsáveis na árvore**, para **saber quem (pessoa, IA, prestador ou máquina) conduz cada nó**.

33. Como **usuário**, quero **tratar atividade com responsável máquina como linguagem de programação**, para **executar nós como procedimentos programáveis**.

## Explorar

34. Como **usuário**, quero **persistir toda unidade de trabalho como arquivo**, para **ter representação estável e explorável do trabalho**.

35. Como **usuário**, quero **explorar unidades em lista na seção Explorar**, para **navegar o projeto como arquivos**.

36. Como **usuário**, quero **navegar por profundidade no explorador**, para **percorrer a hierarquia infinita das unidades**.
