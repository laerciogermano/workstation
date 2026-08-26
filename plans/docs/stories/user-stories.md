# User stories — Plans

Histórias de usuário derivadas de [`plans/README.md`](../../README.md), agrupadas por épico (sem redundâncias).  
Épicos: [`../epics.md`](../epics.md) · Negócio: [`../../README.md`](../../README.md) · Técnico: [`../tech/`](../tech/).

Status: `draft` → `ready` → `in-progress` → `done`.  
Quando `ready`: breakdown em [`../tech/refinements/`](../tech/refinements/).

## Índice

| Épico | ID | História |
|-------|-----|----------|
| [EP-00 — Fundamentos](#ep-00--fundamentos) | [US-01](#us-01--mesma-unidade-e-vocabulário-por-visão) | Mesma unidade e vocabulário por visão |
| EP-00 | [US-02](#us-02--atribuir-responsável-tipado) | Atribuir responsável tipado |
| [EP-01 — Board](#ep-01--board) | [US-03](#us-03--configurar-colunas-e-raias) | Configurar colunas e raias |
| EP-01 | [US-04](#us-04--cadastrar-e-mover-cards) | Cadastrar e mover cards |
| EP-01 | [US-05](#us-05--aninhar-cards) | Aninhar cards |
| EP-01 | [US-06](#us-06--colunas-de-execução-e-orquestração-de-ia) | Colunas de execução e orquestração de IA |
| EP-01 | [US-07](#us-07--chamado-e-prestador-de-serviço) | Chamado e prestador de serviço |
| [EP-02 — Gantt](#ep-02--gantt) | [US-08](#us-08--visualizar-e-cadastrar-ordens-no-tempo) | Visualizar e cadastrar ordens no tempo |
| EP-02 | [US-09](#us-09--tarefas-sequenciais-e-paralelas) | Tarefas sequenciais e paralelas |
| EP-02 | [US-10](#us-10--aninhar-tarefas-no-gantt) | Aninhar tarefas no Gantt |
| EP-02 | [US-11](#us-11--planos-e-execução-via-ais) | Planos e execução via AIs |
| EP-02 | [US-12](#us-12--flow-oriented-programming) | Flow Oriented Programming |
| EP-02 | [US-13](#us-13--máquina-como-linguagem-no-gantt) | Máquina como linguagem no Gantt |
| EP-02 | [US-14](#us-14--exportar-código-e-linguagem-visual-unificada) | Exportar código e linguagem visual unificada |
| [EP-03 — Árvore de execução](#ep-03--árvore-de-execução) | [US-15](#us-15--visualizar-árvore) | Visualizar árvore |
| EP-03 | [US-16](#us-16--criar-atividades-e-hierarquia-infinita) | Criar atividades e hierarquia infinita |
| [EP-04 — Explorar](#ep-04--explorar) | [US-17](#us-17--persistir-e-abrir-no-explorar) | Persistir e abrir no Explorar |
| EP-04 | [US-18](#us-18--lista-e-navegação-por-profundidade) | Lista e navegação por profundidade |

### Por épico

- **EP-00 Fundamentos** — US-01, US-02  
- **EP-01 Board** — US-03 … US-07  
- **EP-02 Gantt** — US-08 … US-14  
- **EP-03 Árvore** — US-15, US-16  
- **EP-04 Explorar** — US-17, US-18  

---

## EP-00 — Fundamentos

### US-01 — Mesma unidade e vocabulário por visão

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **que toda atividade seja a mesma unidade** e **seja nomeada conforme a visão** (card, tarefa, nó ou arquivo), para **não fragmentar o trabalho entre superfícies**.

#### Critérios de aceite

- [ ] Dado que existe uma unidade, quando a abro no board, Gantt, árvore e Explorar, então é a mesma entidade.
- [ ] Dado que altero um atributo em uma visão, quando consulto outra, então a alteração está refletida.
- [ ] Dado que estou em cada visão, quando visualizo a unidade, então o rótulo é card / tarefa / atividade (nó) / arquivo, respectivamente.
- [ ] Dado que a unidade foi removida em uma visão, quando a abro em outra, então não aparece como ativa.

#### Notas

- Id canônico, exclusão, arquivamento e merge ainda abertos no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-02 — Atribuir responsável tipado

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir a uma unidade um responsável** (pessoa, IA, prestador de serviço ou máquina) **ou removê-lo**, para **definir quem conduz o trabalho e o comportamento permitido**.

#### Critérios de aceite

- [ ] Dado que a unidade não tem responsável, quando atribuo pessoa, IA, prestador ou máquina, então o tipo e a identidade ficam visíveis.
- [ ] Dado que o responsável é máquina, quando consulto a unidade, então ela é tratada como linguagem de programação (detalhe de bibliotecas/loops no Gantt: US-11).
- [ ] Dado que o responsável é inválido ou indisponível, quando confirmo, então a atribuição é rejeitada.
- [ ] Dado que a unidade tem responsável, quando o removo, então fica sem responsável e deixa de aplicar regras exclusivas do tipo anterior.

#### Notas

- Cadastro de pessoas/IAs/prestadores/máquinas e herança pai→filho ainda abertos no README.
- Vale em board, Gantt e árvore (sem histórias duplicadas por visão).

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-01 — Board

### US-03 — Configurar colunas e raias

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | membro do time |

#### História

Como **membro do time**, quero **configurar colunas e raias em quantidade livre**, para **adequar o board ao processo do time**.

#### Critérios de aceite

- [ ] Dado que configuro o board, quando adiciono N colunas e M raias, então o board as exibe.
- [ ] Dado que existem colunas/raias, quando removo ou reordeno, então a configuração reflete a alteração.
- [ ] Dado que a coluna/raia contém cards, quando tento remover, então o sistema impede ou exige destino *(política ainda Aberta no README)*.

#### Notas

- Política de remoção com cards aberta no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-04 — Cadastrar e mover cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **cadastrar cards e movê-los entre colunas e raias**, para **registrar e acompanhar o trabalho no fluxo**.

#### Critérios de aceite

- [ ] Dado que estou no board, quando crio um card em coluna e raia, então ele aparece nessa posição.
- [ ] Dado que um card está em uma posição, quando o movo para outra coluna ou raia, então fica só no destino.
- [ ] Dado que faltam dados mínimos ou o destino é inválido, quando tento criar ou mover, então a operação é rejeitada e o estado anterior permanece.

#### Notas

- Campos mínimos do card e restrições de transição (WIP/permissões) abertos no README.
- Atribuição de responsável: US-02.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-05 — Aninhar cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aninhar cards em qualquer profundidade**, para **decompor o trabalho com hierarquia infinita**.

#### Critérios de aceite

- [ ] Dado que existe um card pai, quando crio um filho aninhado, então o filho fica subordinado ao pai.
- [ ] Dado que há uma cadeia aninhada, quando adiciono mais um nível, então o sistema aceita sem limite de profundidade.
- [ ] Dado que o aninhamento criaria ciclo, quando confirmo, então o sistema rejeita.

#### Notas

- Mover pai com filhos ainda aberto no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-06 — Colunas de execução e orquestração de IA

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **marcar colunas de execução e disparar a IA ao mover um card**, para **automatizar a execução quando a IA for a responsável**.

#### Critérios de aceite

- [ ] Dado que configuro o board, quando marco uma ou mais colunas como de execução, então elas ficam identificadas assim.
- [ ] Dado que o card tem responsável IA e a coluna é de execução, quando movo o card para ela, então a IA inicia a execução automaticamente.
- [ ] Dado que a coluna não é de execução, ou o responsável não é IA, quando movo o card, então não há disparo automático por IA.
- [ ] Dado que a IA falha ao iniciar, quando o card já está na coluna de execução, então o card permanece e a falha fica visível.

#### Notas

- Critério de conclusão/falha/retry da IA aberto no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-07 — Chamado e prestador de serviço

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário final / prestador de serviço |

#### História

Como **usuário final**, quero **criar um chamado** (necessidade + serviço), e como **prestador**, quero **assumir, executar e atender**, para **fechar a orquestração entre necessidade e serviço**.

#### Critérios de aceite

- [ ] Dado que sou usuário final, quando crio chamado com necessidade e serviço desejado, então ele fica disponível para prestadores.
- [ ] Dado que faltam necessidade ou serviço, quando tento validar o chamado, então o sistema impede ou sinaliza incompletude.
- [ ] Dado que o chamado está aberto, quando um prestador assume, então ele passa a ser o responsável.
- [ ] Dado que o prestador conclui a execução, quando o atendimento é registrado, então o chamado reflete a necessidade atendida.
- [ ] Dado que já há prestador responsável, quando outro tenta assumir, então a operação é rejeitada ou segue regra de transferência *(ainda Aberta)*.

#### Notas

- Aceite do usuário final, transferência e visibilidade do chamado abertos no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-02 — Gantt

### US-08 — Visualizar e cadastrar ordens no tempo

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **cadastrar tarefas (ordens) e visualizá-las no tempo**, para **planejar e acompanhar o projeto no eixo temporal**.

#### Critérios de aceite

- [ ] Dado que estou no Gantt, quando crio uma tarefa com dados mínimos, então ela passa a compor o plano.
- [ ] Dado que a tarefa tem datas válidas, quando abro o Gantt, então ela aparece posicionada no eixo temporal.
- [ ] Dado que não há tarefas, quando abro o Gantt, então a visão está vazia e utilizável.
- [ ] Dado que a tarefa não tem datas válidas, quando abro o Gantt, então ela não fica posicionada no tempo ou fica sinalizada como incompleta.

#### Notas

- Modelo de datas (início/fim/duração/fuso) aberto no README.
- Responsáveis: US-02.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-09 — Tarefas sequenciais e paralelas

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **definir tarefas sequenciais ou paralelas**, para **expressar dependência e execução simultânea**.

#### Critérios de aceite

- [ ] Dado que existem duas tarefas, quando as defino como sequenciais, então a ordem/dependência fica evidenciada no Gantt.
- [ ] Dado que as defino como paralelas, então podem sobrepor-se no tempo sem dependência mútua obrigatória.
- [ ] Dado que a relação criaria ciclo ou conflito sequencial×paralelo inconsistente, quando confirmo, então o sistema rejeita ou exige resolução explícita.

#### Notas

- Semântica finish-to-start vs. ordem visual e regra exata de conflito ainda abertas no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-10 — Aninhar tarefas no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aninhar tarefas em qualquer profundidade no Gantt**, para **planejar com hierarquia infinita**.

#### Critérios de aceite

- [ ] Dado que existe uma tarefa pai, quando crio uma filha, então a filha fica subordinada no plano.
- [ ] Dado que há hierarquia, quando adiciono mais um nível, então o Gantt aceita sem limite de profundidade.
- [ ] Dado que o aninhamento criaria ciclo, quando confirmo, então o sistema rejeita.

#### Notas

- Roll-up de datas/estado pai←filhos aberto no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-11 — Planos e execução via AIs

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **criar planos no Gantt e executá-los via AIs**, para **unir planejamento e orquestração de inteligência artificial**.

#### Critérios de aceite

- [ ] Dado que estou no Gantt, quando crio um plano, então ele fica disponível para conter tarefas e execução.
- [ ] Dado que o plano tem tarefas com responsável IA, quando solicito execução, então as AIs executam o trabalho correspondente e o andamento fica refletido.
- [ ] Dado que não há tarefas com IA, quando solicito execução via AIs, então não há execução automática por IA (ou o sistema informa a ausência).

#### Notas

- Diferença operacional plano vs. conjunto de tarefas; orquestração parcial e cancelamento abertos no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-12 — Flow Oriented Programming

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aplicar FOP no Gantt** — definir e visualizar **estado** (entradas/saídas) e **procedimentos** (funções/tarefas), para **modelar o plano como fluxo**.

#### Critérios de aceite

- [ ] Dado que estou modelando, quando defino entradas e saídas de uma tarefa, então os artefatos de estado ficam associados e visíveis.
- [ ] Dado que ligo a saída de uma tarefa à entrada de outra, quando visualizo o fluxo, então a conexão fica evidenciada.
- [ ] Dado que defino procedimentos como funções/tarefas, quando consulto o plano, então a lógica executável do fluxo está expressa.
- [ ] Dado que o fluxo está inconsistente para as regras FOP fechadas, quando valido ou exporto, então o sistema sinaliza (exportação útil exige plano consistente).

#### Notas

- Tipo/formato dos artefatos e obrigatoriedade de ligar saídas ainda abertos no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-13 — Máquina como linguagem no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **tratar tarefa com responsável máquina como linguagem de programação no Gantt**, para **usar bibliotecas, laços e estados (entradas/saídas)**.

#### Critérios de aceite

- [ ] Dado que a tarefa tem responsável máquina, quando a edito no Gantt, então posso usar bibliotecas, loops e estados como entradas/saídas.
- [ ] Dado que a tarefa não tem responsável máquina, quando a edito, então não é tratada como linguagem nesse paradigma.
- [ ] Dado que o programa é inválido, quando tento salvar ou executar, então o sistema rejeita ou sinaliza o erro.

#### Notas

- Catálogo de bibliotecas e sintaxe de loops abertos no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-14 — Exportar código e linguagem visual unificada

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **compilar o plano na linguagem visual unificada e exportá-lo como código / para outras linguagens**, para **usar o Gantt como programa FOP de forma redundante**.

#### Critérios de aceite

- [ ] Dado que existe um plano consistente, quando exporto como código, então obtenho artefato utilizável correspondente ao plano.
- [ ] Dado que compilei na linguagem visual unificada, quando exporto para linguagens suportadas, então obtenho artefatos equivalentes.
- [ ] Dado que o plano está vazio/inválido ou a linguagem de destino não é suportada, quando exporto, então a operação é rejeitada ou sem artefato útil.

#### Notas

- Formato de saída e lista de linguagens de destino abertos no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-03 — Árvore de execução

### US-15 — Visualizar árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **ver as atividades (nós) em árvore com seus responsáveis**, para **entender a estrutura e quem conduz cada nó**.

#### Critérios de aceite

- [ ] Dado que existem atividades, quando abro a árvore, então os nós aparecem em hierarquia e os responsáveis ficam visíveis.
- [ ] Dado que a execução está vazia, quando abro a árvore, então a visão está vazia e utilizável.
- [ ] Dado que haveria ciclo, quando a árvore é apresentada, então ciclos não são exibidos como estrutura válida.

#### Notas

- Raiz única vs. múltiplas raízes aberto no README.
- Atribuir/remover responsável: US-02. Máquina como linguagem (procedimento): aplica US-02; paridade com bibliotecas/loops do Gantt ainda Aberta.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-16 — Criar atividades e hierarquia infinita

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **criar atividades raiz e filhas em qualquer profundidade**, para **decompor a execução sem limite de hierarquia**.

#### Critérios de aceite

- [ ] Dado que a árvore está utilizável, quando crio uma atividade raiz, então ela aparece na árvore.
- [ ] Dado que existe qualquer atividade, quando crio uma filha, então o nó filho fica subordinado ao pai.
- [ ] Dado que adiciono mais um nível, quando confirmo, então o sistema aceita sem limite de profundidade.
- [ ] Dado que a operação criaria ciclo ou faltam dados mínimos, quando confirmo, então o sistema rejeita.

#### Notas

- Campos mínimos da atividade abertos no README.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-04 — Explorar

### US-17 — Persistir e abrir no Explorar

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **que toda unidade persista como arquivo e possa ser aberta no Explorar a partir de qualquer visão**, para **ter representação estável e navegável do trabalho**.

#### Critérios de aceite

- [ ] Dado que crio uma unidade em qualquer visão, quando consulto o Explorar, então ela existe como arquivo.
- [ ] Dado que a unidade está em board, Gantt ou árvore, quando peço abri-la no Explorar, então chego ao mesmo arquivo.
- [ ] Dado que a unidade foi persistida, quando a reabro depois, então o conteúdo permanece disponível.
- [ ] Dado que a persistência falha, quando crio/atualizo, então sou informado e não fica gravada como sucesso.

#### Notas

- Formato físico do arquivo é detalhe técnico, não regra de negócio neste nível.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-18 — Lista e navegação por profundidade

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **um explorador em lista com navegação por profundidade**, para **percorrer a hierarquia infinita das unidades como arquivos**.

#### Critérios de aceite

- [ ] Dado que existem unidades, quando abro o Explorar, então vejo lista de arquivos e consigo localizá-las.
- [ ] Dado que há aninhamento, quando navego por profundidade, então entro e saio dos níveis sem limite imposto de profundidade.
- [ ] Dado que o caminho não existe ou a lista está vazia, quando navego ou abro o Explorar, então o sistema informa ausência / lista vazia utilizável.

#### Notas

- Ordenação/filtros/busca e forma exata da UI (drill-down etc.) abertos ou detalhe de interface; a regra é lista + profundidade.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).
