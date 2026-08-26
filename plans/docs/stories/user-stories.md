# User stories — Plans

Histórias de usuário derivadas de [`plans/README.md`](../../README.md), agrupadas por épico.  
Épicos: [`../epics.md`](../epics.md) · Negócio: [`../../README.md`](../../README.md) · Técnico: [`../tech/`](../tech/).

Status: `draft` → `ready` → `in-progress` → `done`.  
Quando `ready`: breakdown em [`../tech/refinements/`](../tech/refinements/).

## Índice

| Épico | ID | História |
|-------|-----|----------|
| [EP-00 — Fundamentos](#ep-00--fundamentos) | [US-01](#us-01--mesma-unidade-vocabulário-e-ciclo-de-vida) | Mesma unidade, vocabulário e ciclo de vida |
| EP-00 | [US-02](#us-02--atribuir-responsável-tipado) | Atribuir responsável tipado |
| [EP-01 — Board](#ep-01--board) | [US-03](#us-03--configurar-colunas-e-raias) | Configurar colunas e raias |
| EP-01 | [US-04](#us-04--cadastrar-e-mover-cards) | Cadastrar e mover cards |
| EP-01 | [US-05](#us-05--aninhar-e-mover-hierarquia-de-cards) | Aninhar e mover hierarquia de cards |
| EP-01 | [US-06](#us-06--colunas-de-execução-e-orquestração-de-ia) | Colunas de execução e orquestração de IA |
| EP-01 | [US-07](#us-07--chamado-e-prestador-de-serviço) | Chamado e prestador de serviço |
| [EP-02 — Gantt](#ep-02--gantt) | [US-08](#us-08--planos-ordens-e-datas) | Planos, ordens e datas |
| EP-02 | [US-09](#us-09--tarefas-sequenciais-e-paralelas) | Tarefas sequenciais e paralelas |
| EP-02 | [US-10](#us-10--aninhar-tarefas-e-roll-up) | Aninhar tarefas e roll-up |
| EP-02 | [US-11](#us-11--execução-de-planos-via-ais) | Execução de planos via AIs |
| EP-02 | [US-12](#us-12--flow-oriented-programming) | Flow Oriented Programming |
| EP-02 | [US-13](#us-13--máquina-como-linguagem-no-gantt) | Máquina como linguagem no Gantt |
| EP-02 | [US-14](#us-14--exportar-código-e-linguagem-visual-unificada) | Exportar código e linguagem visual unificada |
| [EP-03 — Árvore de execução](#ep-03--árvore-de-execução) | [US-15](#us-15--visualizar-árvore-e-responsáveis) | Visualizar árvore e responsáveis |
| EP-03 | [US-16](#us-16--criar-atividades-e-hierarquia-infinita) | Criar atividades e hierarquia infinita |
| [EP-04 — Explorar](#ep-04--explorar) | [US-17](#us-17--persistir-e-abrir-no-explorar) | Persistir e abrir no Explorar |
| EP-04 | [US-18](#us-18--lista-busca-e-navegação-por-profundidade) | Lista, busca e navegação por profundidade |

### Por épico

- **EP-00 Fundamentos** — US-01, US-02  
- **EP-01 Board** — US-03 … US-07  
- **EP-02 Gantt** — US-08 … US-14  
- **EP-03 Árvore** — US-15, US-16  
- **EP-04 Explorar** — US-17, US-18  

---

## EP-00 — Fundamentos

### US-01 — Mesma unidade, vocabulário e ciclo de vida

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **uma unidade com id canônico**, **nomeada conforme a visão**, e poder **excluir ou arquivar**, para **manter identidade única e ciclo de vida consistente**.

#### Critérios de aceite

- [ ] Dado que crio uma unidade, quando a consulto em qualquer visão, então ela compartilha o mesmo **UUID**.
- [ ] Dado que estou no board / Gantt / árvore / Explorar, quando visualizo a unidade, então o rótulo é card / tarefa / atividade (nó) / arquivo.
- [ ] Dado que altero um atributo em uma visão, quando consulto outra, então a alteração está refletida.
- [ ] Dado que **excluo** a unidade, quando abro qualquer visão, então ela não aparece como ativa em nenhuma.
- [ ] Dado que **arquivo** a unidade, quando uso o fluxo ativo (board/Gantt/árvore), então ela não aparece; quando uso o Explorar, então o arquivo permanece.
- [ ] Dado que tento **merge** de unidades, quando a operação é solicitada, então não está disponível em v1 (fora de escopo).

#### Notas

- Regras em [`plans/README.md`](../../README.md) — Modelo / ciclo de vida.

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

Como **usuário**, quero **atribuir ou remover um responsável** a partir do **catálogo do projeto** (pessoa, IA, prestador, máquina), para **definir quem conduz o trabalho sem herança automática**.

#### Critérios de aceite

- [ ] Dado que o item está no catálogo, quando atribuo pessoa, IA, prestador ou máquina, então tipo e identidade ficam visíveis e há no máximo **um** responsável.
- [ ] Dado que o item **não** está no catálogo, quando tento atribuir, então a operação é rejeitada.
- [ ] Dado que existe um pai com responsável, quando crio um filho, então o filho **nasce sem** responsável.
- [ ] Dado que o responsável é máquina, quando consulto a unidade, então ela é tratada como linguagem (Gantt: US-13; árvore: procedimento — US-15).
- [ ] Dado que removo o responsável, quando consulto a unidade, então não há responsável e cessam regras exclusivas do tipo anterior.

#### Notas

- Catálogo e “sem herança” em [`plans/README.md`](../../README.md).

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

Como **membro do time**, quero **configurar colunas e raias em quantidade livre**, para **adequar o board ao processo**, sem perder cards por remoção indevida.

#### Critérios de aceite

- [ ] Dado que configuro o board, quando adiciono N colunas e M raias, então o board as exibe.
- [ ] Dado que existem colunas/raias vazias, quando removo ou reordeno, então a configuração reflete a alteração.
- [ ] Dado que a coluna/raia **contém cards**, quando tento remover, então a remoção é **bloqueada** até esvaziar.

#### Notas

-

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

Como **usuário**, quero **cadastrar cards com título e movê-los entre qualquer coluna/raia válida**, para **registrar e acompanhar o fluxo** (sem WIP em v1).

#### Critérios de aceite

- [ ] Dado que informo **título**, quando crio o card em coluna e raia, então ele aparece nessa posição.
- [ ] Dado que não informo título, quando tento criar, então a criação é rejeitada.
- [ ] Dado que o destino é coluna/raia válida, quando movo o card, então ele fica só no destino (sem restrição WIP/caminho em v1).
- [ ] Dado que o destino é inválido, quando tento mover, então o card permanece na origem.

#### Notas

- Atribuição: US-02.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-05 — Aninhar e mover hierarquia de cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aninhar cards sem ciclo e mover o pai com toda a subárvore**, para **decompor e reposicionar hierarquias**.

#### Critérios de aceite

- [ ] Dado que existe um card pai, quando crio um filho, então o filho fica subordinado e **sem** responsável herdado.
- [ ] Dado que há cadeia aninhada, quando adiciono nível, então não há limite de profundidade.
- [ ] Dado que o aninhamento criaria ciclo, quando confirmo, então é rejeitado.
- [ ] Dado que o pai tem descendentes, quando movo o pai para outra coluna/raia, então **pai e descendentes** vão juntos.

#### Notas

-

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

Como **usuário**, quero **marcar colunas de execução e orquestrar a IA** com estados claros de execução, para **automatizar trabalho com critério de término**.

#### Critérios de aceite

- [ ] Dado que marco colunas como de execução, quando visualizo o board, então elas estão identificadas.
- [ ] Dado que o card tem IA e entro em coluna de execução, quando o movimento completa, então a IA inicia (`em execução`) usando título/descrição e entradas ligadas, produzindo/atualizando saídas.
- [ ] Dado que a execução termina com sucesso, quando consulto o card, então o status é `concluída`.
- [ ] Dado que a execução falha, quando consulto o card, então o status é `falhou`, o card permanece na coluna e a falha é visível.
- [ ] Dado que o status é `falhou`, quando solicito **retry**, então a IA tenta de novo; sem ação do usuário, não há retry automático.
- [ ] Dado que a coluna não é de execução ou o responsável não é IA, quando movo o card, então não há disparo automático por IA.

#### Notas

-

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

Como **usuário final**, quero **abrir chamado** visível aos prestadores, e como **prestador**, quero **assumir, concluir e transferir com aceite**, para **fechar o atendimento**.

#### Critérios de aceite

- [ ] Dado que informo título, necessidade e serviço, quando crio o chamado, então ele fica visível a **todos os prestadores** do catálogo.
- [ ] Dado que faltam necessidade ou serviço, quando valido, então o chamado é inválido.
- [ ] Dado que o chamado está aberto, quando um prestador assume, então ele é o responsável.
- [ ] Dado que o prestador conclui, quando registra a conclusão, então o status fica `aguardando aceite`.
- [ ] Dado que o usuário final aceita, quando confirma, então o status fica `atendido`.
- [ ] Dado que há responsável, quando outro prestador tenta assumir sem liberação/reatribuição, então é rejeitado.
- [ ] Dado que o responsável libera ou um admin reatribui, quando a transferência ocorre, então o novo prestador passa a ser o responsável.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-02 — Gantt

### US-08 — Planos, ordens e datas

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **criar planos e tarefas com título e datas (início/fim)**, para **organizar ordens no tempo**.

#### Critérios de aceite

- [ ] Dado que crio um plano nomeado, quando o abro, então ele pode conter tarefas e execução.
- [ ] Dado que crio uma tarefa só com título, quando não informo plano, então ela entra no **plano padrão** do projeto.
- [ ] Dado que a tarefa tem início e fim válidos (fuso do projeto), quando abro o Gantt, então ela fica posicionada; duração é derivada.
- [ ] Dado que a tarefa não tem datas válidas, quando abro o Gantt, então ela aparece na lista **sem** posição no eixo e sinalizada.
- [ ] Dado que não informo título, quando tento criar tarefa ou plano, então a criação é rejeitada.

#### Notas

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

Como **usuário**, quero **definir sequencial (finish-to-start) ou paralelo**, para **modelar dependências sem conflito**.

#### Critérios de aceite

- [ ] Dado que defino A → B sequencial, quando modelo o plano, então B não inicia antes do fim de A (finish-to-start).
- [ ] Dado que defino A e B paralelas, quando visualizo, então podem sobrepor-se sem dependência mútua obrigatória.
- [ ] Dado que já existe dependência sequencial, quando marco as mesmas como paralelas, então a operação é **rejeitada** até remover a dependência.
- [ ] Dado que a relação criaria ciclo, quando confirmo, então é rejeitada.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-10 — Aninhar tarefas e roll-up

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aninhar tarefas e ver roll-up de datas/estado no pai**, para **planejar hierarquia no tempo**.

#### Critérios de aceite

- [ ] Dado que crio filha sob um pai, quando confirmo, então a filha fica subordinada e sem responsável herdado.
- [ ] Dado que adiciono níveis, quando confirmo, então não há limite de profundidade; ciclos são rejeitados.
- [ ] Dado que os filhos têm datas, quando consulto o pai, então início = min(inícios) e fim = max(fins) dos filhos com data.
- [ ] Dado que algum filho está `falhou`, quando consulto o estado agregado do pai, então o pai reflete falha agregada.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-11 — Execução de planos via AIs

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **executar o plano só nas tarefas com IA e poder cancelar**, para **orquestrar parcialmente com controle**.

#### Critérios de aceite

- [ ] Dado que o plano tem tarefas com e sem IA, quando executo via AIs, então **somente** as com responsável IA entram em `em execução`.
- [ ] Dado que a IA conclui, quando consulto a tarefa, então status `concluída` e saídas atualizadas.
- [ ] Dado que a IA falha, quando consulto, então `falhou` fica visível; retry só com ação explícita.
- [ ] Dado que há execução em andamento, quando cancelo, então as tarefas afetadas ficam `cancelada`.
- [ ] Dado que não há tarefas com IA, quando solicito execução via AIs, então nada executa automaticamente e o sistema informa a ausência.

#### Notas

-

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

Como **usuário**, quero **definir procedimentos e artefatos de estado (nome + referência)**, para **modelar FOP no Gantt**.

#### Critérios de aceite

- [ ] Dado que defino entrada/saída com nome e referência, quando visualizo a tarefa, então o artefato aparece.
- [ ] Dado que ligo saída de A à entrada de B, quando visualizo o fluxo, então a conexão fica evidenciada.
- [ ] Dado que há saída sem consumidor, quando valido/exporto, então recebo **aviso** (não bloqueia só por órfão).
- [ ] Dado que há **ciclo de estado**, quando valido/exporto, então a operação de exportação útil é **bloqueada**.
- [ ] Dado que defino procedimentos como funções/tarefas, quando consulto o plano, então a lógica do fluxo está expressa.

#### Notas

-

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

Como **usuário**, quero **programar tarefa com responsável máquina** usando bibliotecas e loops v1, para **tratar o Gantt como linguagem**.

#### Critérios de aceite

- [ ] Dado que a tarefa tem responsável máquina, quando edito, então posso usar bibliotecas `stdio`, `fs`, `http` e loops `for`/`while`, com estados entrada/saída.
- [ ] Dado que uso biblioteca ou sintaxe fora do conjunto v1, quando salvo, então o sistema rejeita ou sinaliza erro.
- [ ] Dado que a tarefa não tem responsável máquina, quando edito, então não é tratada como linguagem nesse paradigma.
- [ ] Dado que o programa é inválido, quando salvo ou executo, então rejeita ou sinaliza erro.

#### Notas

-

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

Como **usuário**, quero **compilar em FOP-IR e exportar para TypeScript ou Python**, para **usar o plano como programa redundante**.

#### Critérios de aceite

- [ ] Dado que o plano é consistente (sem ciclo de estado), quando exporto, então obtenho **FOP-IR** correspondente ao plano.
- [ ] Dado que escolho destino TypeScript ou Python, quando exporto, então obtenho artefato na linguagem escolhida a partir do FOP-IR.
- [ ] Dado que escolho linguagem não suportada em v1, quando exporto, então a operação é rejeitada.
- [ ] Dado que o plano está vazio ou bloqueado por inconsistência grave, quando exporto, então não há artefato útil.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

## EP-03 — Árvore de execução

### US-15 — Visualizar árvore e responsáveis

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **ver a floresta de atividades com responsáveis** e, se máquina, o **procedimento**, para **entender a execução**.

#### Critérios de aceite

- [ ] Dado que há múltiplas raízes, quando abro a árvore, então todas as raízes e hierarquias aparecem.
- [ ] Dado que nós têm responsáveis, quando visualizo, então os responsáveis ficam visíveis.
- [ ] Dado que o responsável é máquina, quando abro o nó, então posso ver/editar o **procedimento** (sem exigir libs/loops completos do Gantt em v1).
- [ ] Dado que a execução está vazia, quando abro a árvore, então está vazia e utilizável.
- [ ] Dado que haveria ciclo, quando a estrutura é apresentada, então ciclo não é estrutura válida.

#### Notas

- Atribuição: US-02. Libs/loops completos: US-13 (Gantt).

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

Como **usuário**, quero **criar atividades raiz e filhas com título**, para **decompor a execução sem limite de profundidade**.

#### Critérios de aceite

- [ ] Dado que informo título, quando crio atividade raiz, então ela aparece como raiz adicional (floresta).
- [ ] Dado que existe qualquer atividade, quando crio filha com título, então fica subordinada e sem responsável herdado.
- [ ] Dado que não informo título, quando tento criar, então a criação é rejeitada.
- [ ] Dado que adiciono níveis ou tentaria ciclo, quando confirmo, então profundidade é aceita e ciclo é rejeitado.

#### Notas

-

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

Como **usuário**, quero **persistir toda unidade como arquivo e abri-la no Explorar a partir de qualquer visão**, para **navegar a mesma entidade**.

#### Critérios de aceite

- [ ] Dado que crio unidade em qualquer visão, quando consulto o Explorar, então o arquivo existe com o mesmo UUID.
- [ ] Dado que estou no board, Gantt ou árvore, quando peço abrir no Explorar, então chego ao mesmo arquivo.
- [ ] Dado que a unidade foi arquivada, quando abro o Explorar, então o arquivo ainda está acessível.
- [ ] Dado que a persistência falha, quando crio/atualizo, então sou informado e não fica como sucesso.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

### US-18 — Lista, busca e navegação por profundidade

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **lista ordenada por título, busca e drill-down com caminho**, para **percorrer a hierarquia de arquivos**.

#### Critérios de aceite

- [ ] Dado que existem unidades, quando abro o Explorar, então a lista está ordenada por **título**.
- [ ] Dado que busco por texto do título, quando executo a busca, então vejo os arquivos correspondente.
- [ ] Dado que há aninhamento, quando faço drill-down, então entro/saio dos níveis sem limite de profundidade e vejo o **caminho (breadcrumb)**.
- [ ] Dado que o caminho não existe ou a lista está vazia, quando navego, então o sistema informa ausência / lista vazia utilizável.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).
