# User stories — Plans

Histórias de usuário identificadas a partir de `[plans/README.md](../../README.md)`, no formato abstrato, com cenários BDD.

---

## Unidade de trabalho

**US-01 — Mesma unidade de trabalho**  
Como **usuário**, quero **tratar toda atividade como a mesma unidade de trabalho** (card, tarefa, nó ou arquivo), para **organizar o projeto sem fragmentar o modelo mental entre visões**.

- [ ] Dado que existe uma unidade de trabalho no sistema, quando eu a abro no board, no Gantt, na árvore e no Explorar, então ela é a mesma entidade em todas as visões.
- [ ] Dado que altero um atributo da unidade em uma visão, quando consulto a mesma unidade em outra visão, então a alteração está refletida.

**US-02 — Vocabulário por visão**  
Como **usuário**, quero **nomear a unidade conforme a visão em uso**, para **trabalhar no vocabulário natural de cada superfície** (board, Gantt, árvore ou Explorar).

- [ ] Dado que estou no board, quando visualizo uma unidade, então ela é apresentada como **card**.
- [ ] Dado que estou no Gantt, quando visualizo a mesma unidade, então ela é apresentada como **tarefa**.
- [ ] Dado que estou na árvore de execução, quando visualizo a mesma unidade, então ela é apresentada como **atividade** (**nó**).
- [ ] Dado que estou no Explorar, quando visualizo a mesma unidade, então ela é apresentada como **arquivo**.

## Responsáveis

**US-03 — Responsável pessoa**  
Como **usuário**, quero **atribuir uma pessoa como responsável de uma unidade**, para **deixar claro quem executa o trabalho humano**.

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma pessoa, então a unidade passa a exibir essa pessoa como responsável.
- [ ] Dado que uma unidade tem uma pessoa como responsável, quando consulto a unidade, então o tipo de responsável identificado é pessoa.

**US-04 — Responsável IA**  
Como **usuário**, quero **atribuir uma IA como responsável de uma unidade**, para **delegar execução automática quando couber**.

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma IA, então a unidade passa a exibir essa IA como responsável.
- [ ] Dado que uma unidade tem uma IA como responsável, quando consulto a unidade, então o tipo de responsável identificado é IA.

**US-05 — Responsável prestador**  
Como **usuário**, quero **atribuir um prestador de serviço como responsável de uma unidade**, para **intermediar necessidades do usuário final a quem presta o serviço**.

- [ ] Dado que existe uma unidade sem responsável, quando atribuo um prestador de serviço, então a unidade passa a exibir esse prestador como responsável.
- [ ] Dado que uma unidade tem um prestador como responsável, quando consulto a unidade, então o tipo de responsável identificado é prestador de serviço.

**US-06 — Responsável máquina**  
Como **usuário**, quero **atribuir uma máquina como responsável de uma unidade**, para **tratar o trabalho como linguagem de programação executável**.

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma máquina, então a unidade passa a exibir essa máquina como responsável.
- [ ] Dado que uma unidade tem uma máquina como responsável, quando consulto a unidade, então o tipo de responsável identificado é máquina e a unidade é tratada como linguagem de programação.

## Board

**US-07 — Configurar colunas**  
Como **membro do time**, quero **configurar colunas em quantidade livre**, para **refletir o processo de trabalho do time**.

- [ ] Dado que estou configurando o board, quando adiciono N colunas, então o board exibe exatamente essas N colunas.
- [ ] Dado que o board possui colunas, quando removo ou reordeno uma coluna, então a configuração do board reflete a alteração.

**US-08 — Configurar raias**  
Como **membro do time**, quero **configurar raias (swimlanes) em quantidade livre**, para **organizar o quadro conforme o processo do time**.

- [ ] Dado que estou configurando o board, quando adiciono N raias, então o board exibe exatamente essas N raias.
- [ ] Dado que o board possui raias, quando removo ou reordeno uma raia, então a configuração do board reflete a alteração.

**US-09 — Cadastrar cards**  
Como **usuário**, quero **cadastrar cards no board**, para **registrar unidades de trabalho no fluxo**.

- [ ] Dado que estou no board, quando crio um card em uma coluna e raia, então o card aparece nessa posição.
- [ ] Dado que cadastrei um card, quando consulto o board, então o card permanece disponível no fluxo.

**US-10 — Atribuir responsáveis no board**  
Como **usuário**, quero **atribuir responsáveis a cards**, para **definir quem (pessoa, IA, prestador ou máquina) conduz cada item**.

- [ ] Dado que existe um card no board, quando atribuo um responsável de qualquer tipo permitido, então o card exibe esse responsável.
- [ ] Dado que um card já tem responsável, quando altero o responsável, então o card passa a exibir o novo responsável.

**US-11 — Mover cards**  
Como **usuário**, quero **mover cards entre colunas e raias**, para **acompanhar o andamento do trabalho**.

- [ ] Dado que um card está em uma coluna e raia, quando o movo para outra coluna, então ele deixa a origem e aparece no destino.
- [ ] Dado que um card está em uma raia, quando o movo para outra raia, então ele aparece na raia de destino.

**US-12 — Aninhar cards**  
Como **usuário**, quero **aninhar cards em qualquer profundidade**, para **decompor o trabalho com hierarquia infinita**.

- [ ] Dado que existe um card pai, quando crio um card filho aninhado, então o filho fica subordinado ao pai.
- [ ] Dado que existe uma cadeia de cards aninhados, quando adiciono mais um nível de aninhamento, então o sistema aceita sem limite de profundidade.

**US-13 — Colunas de execução**  
Como **usuário**, quero **marcar uma ou mais colunas como colunas de execução**, para **disparar trabalho automático ao mover cards para elas**.

- [ ] Dado que estou configurando o board, quando marco uma ou mais colunas como de execução, então essas colunas ficam identificadas como colunas de execução.
- [ ] Dado que uma coluna não é de execução, quando movo um card para ela, então nenhuma execução automática é disparada por essa coluna.

**US-14 — Orquestrar IA no board**  
Como **usuário**, quero **que uma IA execute automaticamente o trabalho ao mover um card para coluna de execução quando ela for a responsável**, para **orquestrar AIs pelo board**.

- [ ] Dado que um card tem IA como responsável e existe uma coluna de execução, quando movo o card para essa coluna, então a IA inicia a execução do trabalho automaticamente.
- [ ] Dado que um card tem responsável que não é IA e existe uma coluna de execução, quando movo o card para essa coluna, então a execução automática por IA não é disparada.

**US-15 — Criar chamado**  
Como **usuário final**, quero **criar um card (chamado) descrevendo a necessidade e o serviço desejado**, para **solicitar atendimento por prestadores**.

- [ ] Dado que sou usuário final, quando crio um card chamado com necessidade e serviço desejado, então o chamado fica disponível para prestadores.
- [ ] Dado que um chamado foi criado sem descrição da necessidade ou do serviço, quando tento concluí-lo como chamado válido, então o sistema impede ou sinaliza a incompletude.

**US-16 — Atender chamado**  
Como **prestador de serviço**, quero **assumir a responsabilidade de um chamado, executá-lo e atender a necessidade**, para **fechar a orquestração entre usuário final e serviço**.

- [ ] Dado que existe um chamado aberto, quando um prestador assume a responsabilidade, então o chamado passa a ter esse prestador como responsável.
- [ ] Dado que um prestador é responsável pelo chamado, quando conclui a execução, então a necessidade do usuário final fica atendida e o chamado reflete o atendimento.

## Gantt

**US-17 — Visualizar ordens no tempo**  
Como **usuário**, quero **visualizar tarefas (ordens) no tempo**, para **acompanhar o planejamento temporal do projeto**.

- [ ] Dado que existem tarefas com datas no plano, quando abro o Gantt, então as tarefas aparecem posicionadas no eixo temporal.
- [ ] Dado que não há tarefas no plano, quando abro o Gantt, então a visão temporal está vazia e utilizável para novas ordens.

**US-18 — Entradas e saídas**  
Como **usuário**, quero **visualizar entradas e saídas (artefatos de estado) das tarefas**, para **entender o fluxo de estado entre procedimentos**.

- [ ] Dado que uma tarefa possui entradas e saídas definidas, quando a visualizo no Gantt, então os artefatos de estado de entrada e saída são exibidos.
- [ ] Dado que duas tarefas compartilham um artefato de estado, quando visualizo o fluxo, então a saída de uma aparece como entrada da outra quando assim modelado.

**US-19 — Responsáveis no Gantt**  
Como **usuário**, quero **atribuir e visualizar responsáveis nas tarefas do Gantt**, para **saber quem conduz cada ordem**.

- [ ] Dado que existe uma tarefa no Gantt, quando atribuo um responsável, então a tarefa exibe esse responsável.
- [ ] Dado que tarefas possuem responsáveis, quando visualizo o Gantt, então os responsáveis ficam visíveis em cada ordem.

**US-20 — Tarefas sequenciais**  
Como **usuário**, quero **definir tarefas sequenciais**, para **expressar ordem e dependência no tempo**.

- [ ] Dado que existem duas tarefas, quando as defino como sequenciais, então a segunda depende da conclusão ou ordem da primeira.
- [ ] Dado que tarefas estão em sequência, quando visualizo o Gantt, então a ordem temporal e a dependência ficam evidenciadas.

**US-21 — Tarefas paralelas**  
Como **usuário**, quero **definir tarefas paralelas**, para **expressar execução simultânea**.

- [ ] Dado que existem duas tarefas, quando as defino como paralelas, então ambas podem ocorrer no mesmo intervalo temporal sem dependência mútua obrigatória.
- [ ] Dado que tarefas estão em paralelo, quando visualizo o Gantt, então a sobreposição temporal fica evidenciada.

**US-22 — Aninhar tarefas no Gantt**  
Como **usuário**, quero **aninhar tarefas em qualquer profundidade no Gantt**, para **planejar com hierarquia infinita**.

- [ ] Dado que existe uma tarefa pai no Gantt, quando crio uma tarefa filha, então a filha fica subordinada à pai no plano.
- [ ] Dado que existe uma hierarquia de tarefas, quando adiciono mais um nível, então o Gantt aceita sem limite de profundidade.

**US-23 — Criar planos**  
Como **usuário**, quero **criar planos no Gantt**, para **organizar trabalho executável no tempo**.

- [ ] Dado que estou no Gantt, quando crio um plano, então o plano fica disponível para conter tarefas e execução.
- [ ] Dado que um plano foi criado, quando adiciono tarefas a ele, então as tarefas passam a compor esse plano.

**US-24 — Executar planos via AIs**  
Como **usuário**, quero **executar planos via AIs**, para **realizar o trabalho com orquestração de inteligência artificial**.

- [ ] Dado que existe um plano com tarefas atribuídas a AIs, quando solicito a execução do plano, então as AIs passam a executar o trabalho correspondente.
- [ ] Dado que a execução via AIs está em andamento, quando consulto o plano, então o andamento da orquestração fica refletido nas tarefas.

**US-25 — Flow Oriented Programming**  
Como **usuário**, quero **aplicar Flow Oriented Programming no Gantt** (estado e procedimentos), para **modelar o plano como fluxo de entradas, saídas e funções**.

- [ ] Dado que estou modelando no Gantt, quando defino estados como entradas e saídas, então o plano expressa o fluxo de estado entre procedimentos.
- [ ] Dado que estou modelando no Gantt, quando defino procedimentos como funções e tarefas, então o plano expressa a lógica executável do fluxo.

**US-26 — Máquina como linguagem no Gantt**  
Como **usuário**, quero **tratar tarefa com responsável máquina como linguagem de programação**, para **usar bibliotecas, laços e estados (entradas e saídas) no plano**.

- [ ] Dado que uma tarefa tem responsável máquina, quando a edito no Gantt, então posso usar bibliotecas de programação, laços/loops e estados como entradas e saídas.
- [ ] Dado que uma tarefa não tem responsável máquina, quando a edito no Gantt, então ela não é tratada como linguagem de programação nesse paradigma.

**US-27 — Exportar Gantt como código**  
Como **usuário**, quero **exportar o Gantt como código**, para **utilizar o plano como programa no paradigma de Flow Oriented Programming**.

- [ ] Dado que existe um plano no Gantt, quando exporto como código, então obtenho uma representação utilizável como programa FOP.
- [ ] Dado que exportei o Gantt como código, quando utilizo o artefato exportado, então ele corresponde ao plano modelado.

**US-28 — Linguagem visual unificada**  
Como **usuário**, quero **trabalhar com uma linguagem visual unificada que compile e exporte para outras linguagens**, para **desenvolver de forma redundante em múltiplas linguagens a partir de uma estrutura única**.

- [ ] Dado que modeleí um plano na linguagem visual unificada, quando compilo, então obtenho uma representação unificada do fluxo.
- [ ] Dado que tenho a representação unificada, quando exporto para outras linguagens suportadas, então obtenho artefatos equivalentes nas linguagens de destino.

## Árvore de execução

**US-29 — Visualizar árvore**  
Como **usuário**, quero **visualizar as atividades (nós) em árvore**, para **entender a estrutura hierárquica da execução**.

- [ ] Dado que existem atividades na execução, quando abro a árvore, então os nós aparecem em estrutura hierárquica.
- [ ] Dado que a execução está vazia, quando abro a árvore, então a visão está vazia e utilizável para novas atividades.

**US-30 — Criar atividades filhas**  
Como **usuário**, quero **criar atividades filhas a partir de qualquer atividade**, para **decompor o trabalho na árvore**.

- [ ] Dado que existe uma atividade, quando crio uma atividade filha a partir dela, então o nó filho fica subordinado ao nó pai.
- [ ] Dado que existe qualquer atividade na árvore, quando solicito criar filha, então a operação é permitida a partir desse nó.

**US-31 — Hierarquia infinita na árvore**  
Como **usuário**, quero **relacionar atividades em hierarquia infinita**, para **refinar a execução sem limite de profundidade**.

- [ ] Dado que existe uma cadeia de atividades pai-filho, quando adiciono mais um nível de profundidade, então o sistema aceita o novo nó.
- [ ] Dado que a árvore possui múltiplos níveis, quando navego a hierarquia, então o relacionamento entre nós permanece íntegro em qualquer profundidade.

**US-32 — Responsáveis na árvore**  
Como **usuário**, quero **atribuir e visualizar responsáveis na árvore**, para **saber quem (pessoa, IA, prestador ou máquina) conduz cada nó**.

- [ ] Dado que existe um nó na árvore, quando atribuo um responsável, então o nó exibe esse responsável.
- [ ] Dado que nós possuem responsáveis, quando visualizo a árvore, então os responsáveis ficam visíveis em cada atividade.

**US-33 — Máquina como linguagem na árvore**  
Como **usuário**, quero **tratar atividade com responsável máquina como linguagem de programação**, para **executar nós como procedimentos programáveis**.

- [ ] Dado que uma atividade tem responsável máquina, quando a consulto ou edito na árvore, então ela é tratada como linguagem de programação.
- [ ] Dado que uma atividade não tem responsável máquina, quando a consulto na árvore, então ela não é tratada como linguagem de programação.

## Explorar

**US-34 — Persistir como arquivo**  
Como **usuário**, quero **persistir toda unidade de trabalho como arquivo**, para **ter representação estável e explorável do trabalho**.

- [ ] Dado que crio uma unidade em qualquer visão, quando consulto o Explorar, então a unidade existe como arquivo.
- [ ] Dado que uma unidade foi persistida como arquivo, quando a reabro depois, então o conteúdo permanece disponível.

**US-35 — Explorador em lista**  
Como **usuário**, quero **explorar unidades em lista na seção Explorar**, para **navegar o projeto como arquivos**.

- [ ] Dado que existem unidades persistidas, quando abro a seção Explorar, então vejo um explorador de arquivos em lista.
- [ ] Dado que estou no Explorar, quando percorro a lista, então consigo localizar as unidades do projeto.

**US-36 — Navegação por profundidade**  
Como **usuário**, quero **navegar por profundidade no explorador**, para **percorrer a hierarquia infinita das unidades**.

- [ ] Dado que existem unidades aninhadas, quando navego por profundidade no Explorar, então consigo entrar e sair dos níveis da hierarquia.
- [ ] Dado que a hierarquia possui profundidade arbitrária, quando navego até um nível profundo, então o explorador permite percorrer sem limite imposto de profundidade.