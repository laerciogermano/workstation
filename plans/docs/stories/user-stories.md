# User stories — Plans

Histórias de usuário derivadas de [`plans/README.md`](../../README.md), agrupadas por épico.
Épicos: [`../epics.md`](../epics.md) · Negócio: [`../../README.md`](../../README.md) · Técnico: [`../tech/`](../tech/).

Status padrão: `draft`. Fluxo: `draft` → `ready` → `in-progress` → `done`.
Quando `ready`: breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-00 — Fundamentos

### US-01 — Mesma unidade de trabalho

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **tratar toda atividade como a mesma unidade de trabalho** (card, tarefa, nó ou arquivo), para **organizar o projeto sem fragmentar o modelo mental entre visões**.

#### Critérios de aceite

- [ ] Dado que existe uma unidade de trabalho no sistema, quando eu a abro no board, no Gantt, na árvore e no Explorar, então ela é a mesma entidade em todas as visões.
- [ ] Dado que altero um atributo da unidade em uma visão, quando consulto a mesma unidade em outra visão, então a alteração está refletida.
- [ ] Dado que uma unidade foi removida em uma visão, quando tento abri-la em outra visão, então ela não aparece como entidade ativa.

#### Notas

- Identidade estável da unidade entre visões ainda não está formalizada no README de negócio (id canônico, merge, exclusão).

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-02 — Vocabulário por visão

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **nomear a unidade conforme a visão em uso**, para **trabalhar no vocabulário natural de cada superfície** (board, Gantt, árvore ou Explorar).

#### Critérios de aceite

- [ ] Dado que estou no board, quando visualizo uma unidade, então ela é apresentada como **card**.
- [ ] Dado que estou no Gantt, quando visualizo a mesma unidade, então ela é apresentada como **tarefa**.
- [ ] Dado que estou na árvore de execução, quando visualizo a mesma unidade, então ela é apresentada como **atividade** (**nó**).
- [ ] Dado que estou no Explorar, quando visualizo a mesma unidade, então ela é apresentada como **arquivo**.
- [ ] Dado que troco de visão, quando a mesma unidade permanece selecionada, então o rótulo muda conforme a visão sem criar outra entidade.

#### Notas

- Glossário board/Gantt/árvore/Explorar está no README; UI deve espelhar esses nomes sem inventar sinônimos.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-03 — Responsável pessoa

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir uma pessoa como responsável de uma unidade**, para **deixar claro quem executa o trabalho humano**.

#### Critérios de aceite

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma pessoa, então a unidade passa a exibir essa pessoa como responsável.
- [ ] Dado que uma unidade tem uma pessoa como responsável, quando consulto a unidade, então o tipo de responsável identificado é pessoa.
- [ ] Dado que tentamos atribuir uma pessoa inexistente ou inválida, quando confirmo a atribuição, então o sistema rejeita e mantém o responsável anterior (ou nenhum).

#### Notas

- Cadastro/fonte de pessoas (conta, time, convidado) não está definido no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-04 — Responsável IA

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir uma IA como responsável de uma unidade**, para **delegar execução automática quando couber**.

#### Critérios de aceite

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma IA, então a unidade passa a exibir essa IA como responsável.
- [ ] Dado que uma unidade tem uma IA como responsável, quando consulto a unidade, então o tipo de responsável identificado é IA.
- [ ] Dado que a IA escolhida não está disponível, quando tento atribuí-la, então o sistema rejeita a atribuição.

#### Notas

- O que constitui “executar o trabalho” para uma IA (escopo, artefatos, critério de conclusão) ainda está aberto.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-05 — Responsável prestador

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir um prestador de serviço como responsável de uma unidade**, para **intermediar necessidades do usuário final a quem presta o serviço**.

#### Critérios de aceite

- [ ] Dado que existe uma unidade sem responsável, quando atribuo um prestador de serviço, então a unidade passa a exibir esse prestador como responsável.
- [ ] Dado que uma unidade tem um prestador como responsável, quando consulto a unidade, então o tipo de responsável identificado é prestador de serviço.
- [ ] Dado que o prestador não aceita ou não pode assumir, quando a atribuição é tentada ou recusada, então a unidade não fica com esse prestador como responsável ativo.

#### Notas

- Ciclo de convite/aceitação do prestador não está detalhado no README além de assumir, executar e atender.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-06 — Responsável máquina

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir uma máquina como responsável de uma unidade**, para **tratar o trabalho como linguagem de programação executável**.

#### Critérios de aceite

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma máquina, então a unidade passa a exibir essa máquina como responsável.
- [ ] Dado que uma unidade tem uma máquina como responsável, quando consulto a unidade, então o tipo de responsável identificado é máquina e a unidade é tratada como linguagem de programação.
- [ ] Dado que removo o responsável máquina, quando consulto a unidade, então ela deixa de ser tratada como linguagem de programação.

#### Notas

- Bibliotecas, loops e estados aplicam-se explicitamente no Gantt; na unidade genérica, o comportamento mínimo de “linguagem” ainda precisa ser fechado.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-01 — Board

### US-07 — Configurar colunas

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | membro do time |

#### História

Como **membro do time**, quero **configurar colunas em quantidade livre**, para **refletir o processo de trabalho do time**.

#### Critérios de aceite

- [ ] Dado que estou configurando o board, quando adiciono N colunas, então o board exibe exatamente essas N colunas.
- [ ] Dado que o board possui colunas, quando removo ou reordeno uma coluna, então a configuração do board reflete a alteração.
- [ ] Dado que uma coluna contém cards, quando tento removê-la, então o sistema impede a remoção ou exige destino para os cards.

#### Notas

- Política ao remover coluna com cards (bloquear vs. mover) não está no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-08 — Configurar raias

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | membro do time |

#### História

Como **membro do time**, quero **configurar raias (swimlanes) em quantidade livre**, para **organizar o quadro conforme o processo do time**.

#### Critérios de aceite

- [ ] Dado que estou configurando o board, quando adiciono N raias, então o board exibe exatamente essas N raias.
- [ ] Dado que o board possui raias, quando removo ou reordeno uma raia, então a configuração do board reflete a alteração.
- [ ] Dado que uma raia contém cards, quando tento removê-la, então o sistema impede a remoção ou exige destino para os cards.

#### Notas

- Mesma lacuna de política de remoção com cards que nas colunas.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-09 — Cadastrar cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **cadastrar cards no board**, para **registrar unidades de trabalho no fluxo**.

#### Critérios de aceite

- [ ] Dado que estou no board, quando crio um card em uma coluna e raia, então o card aparece nessa posição.
- [ ] Dado que cadastrei um card, quando consulto o board, então o card permanece disponível no fluxo.
- [ ] Dado que não informo os dados mínimos exigidos, quando tento cadastrar o card, então o sistema rejeita a criação.

#### Notas

- Campos mínimos do card (título, descrição etc.) não estão especificados no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-10 — Atribuir responsáveis no board

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir responsáveis a cards**, para **definir quem (pessoa, IA, prestador ou máquina) conduz cada item**.

#### Critérios de aceite

- [ ] Dado que existe um card no board, quando atribuo um responsável de qualquer tipo permitido, então o card exibe esse responsável.
- [ ] Dado que um card já tem responsável, quando altero o responsável, então o card passa a exibir o novo responsável.
- [ ] Dado que informo um tipo de responsável não permitido, quando tento atribuir, então o sistema rejeita a operação.

#### Notas

- Se um card pode ter múltiplos responsáveis ou apenas um não está no README (assume-se um).

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-11 — Mover cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **mover cards entre colunas e raias**, para **acompanhar o andamento do trabalho**.

#### Critérios de aceite

- [ ] Dado que um card está em uma coluna e raia, quando o movo para outra coluna, então ele deixa a origem e aparece no destino.
- [ ] Dado que um card está em uma raia, quando o movo para outra raia, então ele aparece na raia de destino.
- [ ] Dado que o destino é inválido ou inexistente, quando tento mover o card, então o card permanece na posição original.

#### Notas

- Restrições de transição entre colunas (WIP, permissões) não estão no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-12 — Aninhar cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aninhar cards em qualquer profundidade**, para **decompor o trabalho com hierarquia infinita**.

#### Critérios de aceite

- [ ] Dado que existe um card pai, quando crio um card filho aninhado, então o filho fica subordinado ao pai.
- [ ] Dado que existe uma cadeia de cards aninhados, quando adiciono mais um nível de aninhamento, então o sistema aceita sem limite de profundidade.
- [ ] Dado que tento aninhar um card em si mesmo ou criar ciclo, quando confirmo, então o sistema rejeita o aninhamento.

#### Notas

- Comportamento de mover pai com filhos no board não está especificado.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-13 — Colunas de execução

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **marcar uma ou mais colunas como colunas de execução**, para **disparar trabalho automático ao mover cards para elas**.

#### Critérios de aceite

- [ ] Dado que estou configurando o board, quando marco uma ou mais colunas como de execução, então essas colunas ficam identificadas como colunas de execução.
- [ ] Dado que uma coluna não é de execução, quando movo um card para ela, então nenhuma execução automática é disparada por essa coluna.
- [ ] Dado que desmarco uma coluna de execução, quando movo um card para ela, então não há disparo automático decorrente dessa coluna.

#### Notas

- Se cards já presentes na coluna no momento da marcação disparam execução retroativa não está definido.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-14 — Orquestrar IA no board

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **que uma IA execute automaticamente o trabalho ao mover um card para coluna de execução quando ela for a responsável**, para **orquestrar AIs pelo board**.

#### Critérios de aceite

- [ ] Dado que um card tem IA como responsável e existe uma coluna de execução, quando movo o card para essa coluna, então a IA inicia a execução do trabalho automaticamente.
- [ ] Dado que um card tem responsável que não é IA e existe uma coluna de execução, quando movo o card para essa coluna, então a execução automática por IA não é disparada.
- [ ] Dado que a IA falha ao iniciar a execução, quando o card já está na coluna de execução, então o card permanece na coluna e o estado de falha fica visível.

#### Notas

- Critério de sucesso/falha da execução da IA e retries não estão no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-15 — Criar chamado

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário final |

#### História

Como **usuário final**, quero **criar um card (chamado) descrevendo a necessidade e o serviço desejado**, para **solicitar atendimento por prestadores**.

#### Critérios de aceite

- [ ] Dado que sou usuário final, quando crio um card chamado com necessidade e serviço desejado, então o chamado fica disponível para prestadores.
- [ ] Dado que um chamado foi criado sem descrição da necessidade ou do serviço, quando tento concluí-lo como chamado válido, então o sistema impede ou sinaliza a incompletude.
- [ ] Dado que não sou usuário final autorizado, quando tento criar chamado, então a operação é negada.

#### Notas

- Campos obrigatórios exatos do chamado e visibilidade para quais prestadores ainda abertos.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-16 — Atender chamado

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | prestador de serviço |

#### História

Como **prestador de serviço**, quero **assumir a responsabilidade de um chamado, executá-lo e atender a necessidade**, para **fechar a orquestração entre usuário final e serviço**.

#### Critérios de aceite

- [ ] Dado que existe um chamado aberto, quando um prestador assume a responsabilidade, então o chamado passa a ter esse prestador como responsável.
- [ ] Dado que um prestador é responsável pelo chamado, quando conclui a execução, então a necessidade do usuário final fica atendida e o chamado reflete o atendimento.
- [ ] Dado que o chamado já tem prestador responsável, quando outro prestador tenta assumir, então a operação é rejeitada ou segue regra explícita de transferência.

#### Notas

- Transferência entre prestadores e definição de “atendido” (aceite do usuário final?) não estão no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-02 — Gantt

### US-17 — Visualizar ordens no tempo

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **visualizar tarefas (ordens) no tempo**, para **acompanhar o planejamento temporal do projeto**.

#### Critérios de aceite

- [ ] Dado que existem tarefas com datas no plano, quando abro o Gantt, então as tarefas aparecem posicionadas no eixo temporal.
- [ ] Dado que não há tarefas no plano, quando abro o Gantt, então a visão temporal está vazia e utilizável para novas ordens.
- [ ] Dado que uma tarefa não tem datas válidas, quando abro o Gantt, então ela não aparece posicionada no tempo ou fica sinalizada como incompleta.

#### Notas

- Modelo de datas (início/fim, duração, fuso) não está no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-18 — Entradas e saídas

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **visualizar entradas e saídas (artefatos de estado) das tarefas**, para **entender o fluxo de estado entre procedimentos**.

#### Critérios de aceite

- [ ] Dado que uma tarefa possui entradas e saídas definidas, quando a visualizo no Gantt, então os artefatos de estado de entrada e saída são exibidos.
- [ ] Dado que duas tarefas compartilham um artefato de estado, quando visualizo o fluxo, então a saída de uma aparece como entrada da outra quando assim modelado.
- [ ] Dado que uma tarefa não tem entradas/saídas, quando a visualizo, então a ausência fica clara (sem artefatos inventados).

#### Notas

- Formato/tipo dos artefatos de estado ainda não especificado.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-19 — Responsáveis no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir e visualizar responsáveis nas tarefas do Gantt**, para **saber quem conduz cada ordem**.

#### Critérios de aceite

- [ ] Dado que existe uma tarefa no Gantt, quando atribuo um responsável, então a tarefa exibe esse responsável.
- [ ] Dado que tarefas possuem responsáveis, quando visualizo o Gantt, então os responsáveis ficam visíveis em cada ordem.
- [ ] Dado que atribuo responsável inválido, quando confirmo, então a tarefa mantém o responsável anterior (ou nenhum).

#### Notas

- Alinhado aos tipos de responsável do README (pessoa, IA, prestador, máquina).

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-20 — Tarefas sequenciais

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **definir tarefas sequenciais**, para **expressar ordem e dependência no tempo**.

#### Critérios de aceite

- [ ] Dado que existem duas tarefas, quando as defino como sequenciais, então a segunda depende da conclusão ou ordem da primeira.
- [ ] Dado que tarefas estão em sequência, quando visualizo o Gantt, então a ordem temporal e a dependência ficam evidenciadas.
- [ ] Dado que a sequência criaria dependência cíclica, quando tento salvá-la, então o sistema rejeita.

#### Notas

- Se a dependência é finish-to-start estrita ou apenas ordem visual ainda aberto.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-21 — Tarefas paralelas

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **definir tarefas paralelas**, para **expressar execução simultânea**.

#### Critérios de aceite

- [ ] Dado que existem duas tarefas, quando as defino como paralelas, então ambas podem ocorrer no mesmo intervalo temporal sem dependência mútua obrigatória.
- [ ] Dado que tarefas estão em paralelo, quando visualizo o Gantt, então a sobreposição temporal fica evidenciada.
- [ ] Dado que marco como paralelas tarefas que já têm dependência sequencial conflitante, quando confirmo, então o sistema rejeita ou remove a dependência conflitante de forma explícita.

#### Notas

- Regra de conflito paralelo vs. sequencial precisa ser fechada na implementação.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-22 — Aninhar tarefas no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aninhar tarefas em qualquer profundidade no Gantt**, para **planejar com hierarquia infinita**.

#### Critérios de aceite

- [ ] Dado que existe uma tarefa pai no Gantt, quando crio uma tarefa filha, então a filha fica subordinada ao pai no plano.
- [ ] Dado que existe uma hierarquia de tarefas, quando adiciono mais um nível, então o Gantt aceita sem limite de profundidade.
- [ ] Dado que tento criar ciclo de aninhamento, quando confirmo, então o sistema rejeita.

#### Notas

- Roll-up de datas/estado do pai a partir dos filhos não está no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-23 — Criar planos

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **criar planos no Gantt**, para **organizar trabalho executável no tempo**.

#### Critérios de aceite

- [ ] Dado que estou no Gantt, quando crio um plano, então o plano fica disponível para conter tarefas e execução.
- [ ] Dado que um plano foi criado, quando adiciono tarefas a ele, então as tarefas passam a compor esse plano.
- [ ] Dado que não informo identificação mínima do plano, quando tento criá-lo, então o sistema rejeita.

#### Notas

- Diferença entre “plano” e conjunto de tarefas no Gantt ainda conceitual no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-24 — Executar planos via AIs

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **executar planos via AIs**, para **realizar o trabalho com orquestração de inteligência artificial**.

#### Critérios de aceite

- [ ] Dado que existe um plano com tarefas atribuídas a AIs, quando solicito a execução do plano, então as AIs passam a executar o trabalho correspondente.
- [ ] Dado que a execução via AIs está em andamento, quando consulto o plano, então o andamento da orquestração fica refletido nas tarefas.
- [ ] Dado que o plano não tem tarefas com IA responsável, quando solicito execução via AIs, então nada é executado automaticamente por IA (ou o sistema informa a ausência).

#### Notas

- Orquestração parcial (só algumas tarefas com IA) e cancelamento de execução não estão no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-25 — Flow Oriented Programming

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aplicar Flow Oriented Programming no Gantt** (estado e procedimentos), para **modelar o plano como fluxo de entradas, saídas e funções**.

#### Critérios de aceite

- [ ] Dado que estou modelando no Gantt, quando defino estados como entradas e saídas, então o plano expressa o fluxo de estado entre procedimentos.
- [ ] Dado que estou modelando no Gantt, quando defino procedimentos como funções e tarefas, então o plano expressa a lógica executável do fluxo.
- [ ] Dado que o fluxo fica inconsistente (saída sem consumidor obrigatório quando a regra exigir), quando valido, então o sistema sinaliza a inconsistência.

#### Notas

- Semântica formal FOP (obrigatoriedade de ligar saídas, tipagem) não está no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-26 — Máquina como linguagem no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **tratar tarefa com responsável máquina como linguagem de programação**, para **usar bibliotecas, laços e estados (entradas e saídas) no plano**.

#### Critérios de aceite

- [ ] Dado que uma tarefa tem responsável máquina, quando a edito no Gantt, então posso usar bibliotecas de programação, laços/loops e estados como entradas e saídas.
- [ ] Dado que uma tarefa não tem responsável máquina, quando a edito no Gantt, então ela não é tratada como linguagem de programação nesse paradigma.
- [ ] Dado que o programa da tarefa máquina é inválido, quando tento salvar ou executar, então o sistema rejeita ou sinaliza o erro.

#### Notas

- Catálogo de bibliotecas e sintaxe dos loops não estão no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-27 — Exportar Gantt como código

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **exportar o Gantt como código**, para **utilizar o plano como programa no paradigma de Flow Oriented Programming**.

#### Critérios de aceite

- [ ] Dado que existe um plano no Gantt, quando exporto como código, então obtenho uma representação utilizável como programa FOP.
- [ ] Dado que exportei o Gantt como código, quando utilizo o artefato exportado, então ele corresponde ao plano modelado.
- [ ] Dado que o plano está vazio ou inválido para exportação, quando tento exportar, então o sistema impede ou gera aviso sem artefato útil.

#### Notas

- Formato de saída (arquivo, linguagem intermediária) não está definido no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-28 — Linguagem visual unificada

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **trabalhar com uma linguagem visual unificada que compile e exporte para outras linguagens**, para **desenvolver de forma redundante em múltiplas linguagens a partir de uma estrutura única**.

#### Critérios de aceite

- [ ] Dado que modeleí um plano na linguagem visual unificada, quando compilo, então obtenho uma representação unificada do fluxo.
- [ ] Dado que tenho a representação unificada, quando exporto para outras linguagens suportadas, então obtenho artefatos equivalentes nas linguagens de destino.
- [ ] Dado que escolho uma linguagem de destino não suportada, quando exporto, então a operação é rejeitada.

#### Notas

- Lista de linguagens suportadas e equivalência semântica da exportação ainda abertas.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-03 — Árvore de execução

### US-29 — Visualizar árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **visualizar as atividades (nós) em árvore**, para **entender a estrutura hierárquica da execução**.

#### Critérios de aceite

- [ ] Dado que existem atividades na execução, quando abro a árvore, então os nós aparecem em estrutura hierárquica.
- [ ] Dado que a execução está vazia, quando abro a árvore, então a visão está vazia e utilizável para novas atividades.
- [ ] Dado que a hierarquia está inconsistente, quando abro a árvore, então o sistema não apresenta ciclos e sinaliza erro se detectado.

#### Notas

- Raiz única vs. múltiplas raízes não está no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-30 — Criar atividades filhas

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **criar atividades filhas a partir de qualquer atividade**, para **decompor o trabalho na árvore**.

#### Critérios de aceite

- [ ] Dado que existe uma atividade, quando crio uma atividade filha a partir dela, então o nó filho fica subordinado ao nó pai.
- [ ] Dado que existe qualquer atividade na árvore, quando solicito criar filha, então a operação é permitida a partir desse nó.
- [ ] Dado que os dados mínimos da filha não são informados, quando tento criar, então o sistema rejeita.

#### Notas

- Campos mínimos da atividade não especificados.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-31 — Hierarquia infinita na árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **relacionar atividades em hierarquia infinita**, para **refinar a execução sem limite de profundidade**.

#### Critérios de aceite

- [ ] Dado que existe uma cadeia de atividades pai-filho, quando adiciono mais um nível de profundidade, então o sistema aceita o novo nó.
- [ ] Dado que a árvore possui múltiplos níveis, quando navego a hierarquia, então o relacionamento entre nós permanece íntegro em qualquer profundidade.
- [ ] Dado que uma operação criaria ciclo, quando confirmo, então o sistema rejeita.

#### Notas

- Limites práticos de UI/performance não são regra de negócio; a regra é ausência de limite de profundidade.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-32 — Responsáveis na árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir e visualizar responsáveis na árvore**, para **saber quem (pessoa, IA, prestador ou máquina) conduz cada nó**.

#### Critérios de aceite

- [ ] Dado que existe um nó na árvore, quando atribuo um responsável, então o nó exibe esse responsável.
- [ ] Dado que nós possuem responsáveis, quando visualizo a árvore, então os responsáveis ficam visíveis em cada atividade.
- [ ] Dado que o responsável é inválido, quando tento atribuir, então o nó não muda de responsável.

#### Notas

- Herança de responsável do pai para filhos não está no README (assume-se atribuição explícita).

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-33 — Máquina como linguagem na árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **tratar atividade com responsável máquina como linguagem de programação**, para **executar nós como procedimentos programáveis**.

#### Critérios de aceite

- [ ] Dado que uma atividade tem responsável máquina, quando a consulto ou edito na árvore, então ela é tratada como linguagem de programação.
- [ ] Dado que uma atividade não tem responsável máquina, quando a consulto na árvore, então ela não é tratada como linguagem de programação.
- [ ] Dado que o procedimento da atividade máquina é inválido, quando tento salvar ou executar, então o sistema rejeita ou sinaliza o erro.

#### Notas

- Paridade com capacidades de máquina no Gantt (bibliotecas/loops) na árvore ainda não detalhada no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-04 — Explorar

### US-34 — Persistir como arquivo

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **persistir toda unidade de trabalho como arquivo**, para **ter representação estável e explorável do trabalho**.

#### Critérios de aceite

- [ ] Dado que crio uma unidade em qualquer visão, quando consulto o Explorar, então a unidade existe como arquivo.
- [ ] Dado que uma unidade foi persistida como arquivo, quando a reabro depois, então o conteúdo permanece disponível.
- [ ] Dado que a persistência falha, quando a criação/atualização é tentada, então o usuário é informado e a unidade não aparece como gravada com sucesso.

#### Notas

- Formato físico do arquivo e local de armazenamento não são regra de negócio neste nível.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-35 — Explorador em lista

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **explorar unidades em lista na seção Explorar**, para **navegar o projeto como arquivos**.

#### Critérios de aceite

- [ ] Dado que existem unidades persistidas, quando abro a seção Explorar, então vejo um explorador de arquivos em lista.
- [ ] Dado que estou no Explorar, quando percorro a lista, então consigo localizar as unidades do projeto.
- [ ] Dado que não há unidades, quando abro o Explorar, então a lista está vazia e utilizável.

#### Notas

- Ordenação/filtros da lista não estão no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-36 — Navegação por profundidade

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **navegar por profundidade no explorador**, para **percorrer a hierarquia infinita das unidades**.

#### Critérios de aceite

- [ ] Dado que existem unidades aninhadas, quando navego por profundidade no Explorar, então consigo entrar e sair dos níveis da hierarquia.
- [ ] Dado que a hierarquia possui profundidade arbitrária, quando navego até um nível profundo, então o explorador permite percorrer sem limite imposto de profundidade.
- [ ] Dado que tento navegar para um caminho inexistente, quando a navegação é solicitada, então o sistema informa que o destino não existe.

#### Notas

- Breadcrumb vs. drill-down é detalhe de UI; a regra é navegação por profundidade na hierarquia infinita.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).
