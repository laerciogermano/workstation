# User stories — Plans

Histórias de usuário derivadas de [`plans/README.md`](../../README.md), agrupadas por épico.  
Épicos: [`../epics.md`](../epics.md) · Negócio: [`../../README.md`](../../README.md) · Técnico: [`../tech/`](../tech/).

Status: `draft` → `ready` → `in-progress` → `done`.  
Quando `ready`: breakdown em [`../tech/refinements/`](../tech/refinements/).

## Índice

| Épico | ID | História |
|-------|-----|----------|
| EP-00 — Fundamentos | US-01 | Mesma unidade, vocabulário e ciclo de vida |
| EP-00 | US-02 | Atribuir responsável tipado |
| EP-00 | US-03 | Gerenciar catálogo de responsáveis |
| EP-01 — Board | US-04 | Configurar colunas e raias |
| EP-01 | US-05 | Cadastrar e mover cards |
| EP-01 | US-06 | Aninhar e mover hierarquia de cards |
| EP-01 | US-07 | Colunas de execução e orquestração de IA |
| EP-01 | US-08 | Chamado e prestador de serviço |
| EP-02 — Gantt | US-09 | Planos, ordens e datas |
| EP-02 | US-10 | Tarefas sequenciais e paralelas |
| EP-02 | US-11 | Aninhar tarefas e roll-up |
| EP-02 | US-12 | Execução de planos via AIs |
| EP-02 | US-13 | Flow Oriented Programming |
| EP-02 | US-14 | Máquina como linguagem no Gantt |
| EP-02 | US-15 | Exportar código e linguagem visual unificada |
| EP-03 — Árvore de execução | US-16 | Visualizar árvore e responsáveis |
| EP-03 | US-17 | Criar atividades e hierarquia infinita |
| EP-04 — Explorar | US-18 | Persistir e abrir no Explorar |
| EP-04 | US-19 | Lista, busca e navegação por profundidade |

Versões de entrega: [`../versions.md`](../versions.md).

### Por épico

- **EP-00 Fundamentos** — US-01 … US-03  
- **EP-01 Board** — US-04 … US-08  
- **EP-02 Gantt** — US-09 … US-15  
- **EP-03 Árvore** — US-16, US-17  
- **EP-04 Explorar** — US-18, US-19  

---

<a id="ep-00"></a>
## EP-00 — Fundamentos

<a id="us-01"></a>
### US-01 — Mesma unidade, vocabulário e ciclo de vida

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | ready |
| Persona | usuário |

#### História

Como **usuário**, quero **uma unidade com id canônico**, **nomeada conforme a visão**, e poder **excluir, arquivar ou desarquivar**, para **manter identidade única e ciclo de vida consistente**.

#### Critérios de aceite

- [ ] Dado que crio uma unidade, quando a consulto em qualquer visão, então ela compartilha o mesmo **UUID**.
- [ ] Dado que estou no board / Gantt / árvore / Explorar, quando visualizo a unidade, então o rótulo é card / tarefa / atividade (nó) / arquivo.
- [ ] Dado que altero o **título** em uma visão, quando consulto outra, então o título está refletido.
- [ ] Dado que **excluo** a unidade, quando abro qualquer visão, então ela não aparece como ativa em nenhuma.
- [ ] Dado que a unidade tem filhos, quando a **excluo**, então a unidade e a subárvore deixam de aparecer como ativas em todas as visões.
- [ ] Dado que **arquivo** a unidade, quando uso o fluxo ativo, então ela não aparece; quando uso o Explorar, então o arquivo permanece.
- [ ] Dado que a unidade está arquivada, quando **desarquivo**, então ela volta a aparecer no fluxo ativo com o mesmo UUID.
- [ ] Dado que tento **merge** de unidades, quando a operação é solicitada, então não está disponível em v1 (fora de escopo).

#### Notas

- Regras em [`plans/README.md`](../../README.md).

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-02"></a>
### US-02 — Atribuir responsável tipado

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | ready |
| Persona | usuário |

#### História

Como **usuário**, quero **atribuir, trocar ou remover um responsável** a partir do **catálogo do projeto**, para **definir quem conduz o trabalho sem herança automática**.

#### Critérios de aceite

- [ ] Dado que o item está no catálogo, quando atribuo pessoa, IA, prestador ou máquina, então tipo e identidade ficam visíveis e há no máximo **um** responsável.
- [ ] Dado que a unidade já tem responsável A, quando atribuo B do catálogo, então B substitui A (troca).
- [ ] Dado que o item **não** está no catálogo, quando tento atribuir, então a operação é rejeitada.
- [ ] Dado que existe um pai com responsável, quando crio um filho, então o filho **nasce sem** responsável.
- [ ] Dado que o responsável é máquina, quando consulto a unidade, então ela é tratada como linguagem (Gantt: US-14; árvore: procedimento — US-16).
- [ ] Dado que removo o responsável, quando consulto a unidade, então não há responsável e cessam regras exclusivas do tipo anterior.

#### Notas

- Catálogo: US-03.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-03"></a>
### US-03 — Gerenciar catálogo de responsáveis

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | ready |
| Persona | administrador do projeto |

#### História

Como **administrador do projeto**, quero **incluir e remover pessoas, IAs, prestadores e máquinas no catálogo**, para **controlar quem pode ser atribuído como responsável**.

#### Critérios de aceite

- [ ] Dado que adiciono pessoa, IA, prestador ou máquina ao catálogo, quando um usuário atribui responsável, então o item passa a ser selecionável.
- [ ] Dado que o item está no catálogo e **não** é responsável de nenhuma unidade, quando o removo do catálogo, então deixa de ser atribuível.
- [ ] Dado que o item ainda é responsável de alguma unidade, quando tento removê-lo do catálogo, então a remoção é bloqueada ou exige reatribuição/limpeza antes.
- [ ] Dado que o catálogo está vazio para um tipo, quando tento atribuir esse tipo, então não há opções válidas e a atribuição não completa.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="ep-01"></a>
## EP-01 — Board

<a id="us-04"></a>
### US-04 — Configurar colunas e raias

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | ready |
| Persona | membro do time |

#### História

Como **membro do time**, quero **configurar colunas e raias em quantidade livre**, para **adequar o board ao processo**, sem perder cards por remoção indevida.

#### Critérios de aceite

- [ ] Dado que o board está vazio de configuração, quando o abro, então posso adicionar a primeira coluna e raia (board utilizável).
- [ ] Dado que configuro o board, quando adiciono N colunas e M raias, então o board as exibe.
- [ ] Dado que existem colunas/raias vazias, quando removo ou reordeno, então a configuração reflete a alteração.
- [ ] Dado que a coluna/raia **contém cards**, quando tento remover, então a remoção é **bloqueada** até esvaziar.
- [ ] Dado que esvaziei a coluna/raia, quando removo, então ela deixa de existir no board.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-05"></a>
### US-05 — Cadastrar e mover cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | ready |
| Persona | usuário |

#### História

Como **usuário**, quero **cadastrar cards com título e movê-los entre qualquer coluna/raia válida**, para **registrar e acompanhar o fluxo** (sem WIP em v1).

#### Critérios de aceite

- [ ] Dado que informo **título**, quando crio o card em coluna e raia, então ele aparece nessa posição.
- [ ] Dado que não informo título, quando tento criar, então a criação é rejeitada.
- [ ] Dado que o card existe, quando altero o título, então o novo título aparece no board e nas demais visões.
- [ ] Dado que o destino é coluna/raia válida, quando movo o card, então ele fica só no destino (sem restrição WIP/caminho em v1).
- [ ] Dado que o destino é inválido, quando tento mover, então o card permanece na origem.

#### Notas

- Atribuição: US-02.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-06"></a>
### US-06 — Aninhar e mover hierarquia de cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aninhar, desaninhar e mover o pai com toda a subárvore**, para **decompor e reposicionar hierarquias**.

#### Critérios de aceite

- [ ] Dado que existe um card pai, quando crio um filho, então o filho fica subordinado e **sem** responsável herdado.
- [ ] Dado que há cadeia aninhada, quando adiciono nível, então não há limite de profundidade.
- [ ] Dado que o aninhamento criaria ciclo, quando confirmo, então é rejeitado.
- [ ] Dado que um card é filho, quando o **desaninho**, então ele deixa de ter aquele pai e permanece no board.
- [ ] Dado que o pai tem descendentes, quando movo o pai para outra coluna/raia, então **pai e descendentes** vão juntos.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-07"></a>
### US-07 — Colunas de execução e orquestração de IA

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **marcar ou desmarcar colunas de execução e orquestrar a IA** com estados claros, para **automatizar trabalho com critério de término**.

#### Critérios de aceite

- [ ] Dado que marco colunas como de execução, quando visualizo o board, então elas estão identificadas.
- [ ] Dado que uma coluna é de execução, quando a **desmarco**, então deixar de ser de execução e novos movimentos para ela não disparam IA.
- [ ] Dado que o card tem IA (status `pendente`) e entro em coluna de execução, quando o movimento completa, então a IA inicia (`em execução`) usando título/descrição e entradas ligadas, produzindo/atualizando saídas.
- [ ] Dado que a execução termina com sucesso, quando consulto o card, então o status é `concluída`.
- [ ] Dado que a execução falha, quando consulto o card, então o status é `falhou`, o card permanece na coluna e a falha é visível.
- [ ] Dado que o status é `falhou`, quando solicito **retry**, então a IA tenta de novo; sem ação do usuário, não há retry automático.
- [ ] Dado que a coluna não é de execução ou o responsável não é IA, quando movo o card, então não há disparo automático por IA.
- [ ] Dado que cards já estão na coluna no momento em que a marco como execução, quando a marcação ocorre, então **não** há disparo retroativo automático (só novos movimentos).

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-08"></a>
### US-08 — Chamado e prestador de serviço

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário final / prestador de serviço |

#### História

Como **usuário final**, quero **abrir chamado** visível aos prestadores, e como **prestador**, quero **assumir, concluir e transferir**, com **aceite ou rejeição** do usuário final, para **fechar o atendimento**.

#### Critérios de aceite

- [ ] Dado que informo título, necessidade e serviço, quando crio o chamado, então ele fica visível a **todos os prestadores** do catálogo.
- [ ] Dado que faltam necessidade ou serviço, quando valido, então o chamado é inválido.
- [ ] Dado que o chamado está aberto, quando um prestador assume, então ele é o responsável.
- [ ] Dado que o prestador conclui, quando registra a conclusão, então o status fica `aguardando aceite`.
- [ ] Dado que o usuário final **aceita**, quando confirma, então o status fica `atendido`.
- [ ] Dado que o usuário final **rejeita** o aceite, quando confirma, então o chamado volta a estado acionável pelo prestador (não `atendido`) e a rejeição fica visível.
- [ ] Dado que há responsável, quando outro prestador tenta assumir sem liberação/reatribuição, então é rejeitado.
- [ ] Dado que o responsável libera ou um admin reatribui, quando a transferência ocorre, então o novo prestador passa a ser o responsável.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="ep-02"></a>
## EP-02 — Gantt

<a id="us-09"></a>
### US-09 — Planos, ordens e datas

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **criar e gerenciar planos e tarefas com título e datas (início/fim)**, para **organizar ordens no tempo**.

#### Critérios de aceite

- [ ] Dado que crio um plano nomeado, quando o abro, então ele pode conter tarefas e execução.
- [ ] Dado que crio uma tarefa só com título, quando não informo plano, então ela entra no **plano padrão** do projeto.
- [ ] Dado que a tarefa tem início e fim válidos (fuso do projeto), quando abro o Gantt, então ela fica posicionada; duração é derivada.
- [ ] Dado que altero início ou fim, quando salvo, então a posição no eixo e a duração derivada são atualizadas.
- [ ] Dado que a tarefa não tem datas válidas, quando abro o Gantt, então ela aparece na lista **sem** posição no eixo e sinalizada.
- [ ] Dado que início > fim, quando tento salvar, então a operação é rejeitada.
- [ ] Dado que a tarefa está no plano A, quando a movo para o plano B, então ela deixa A e passa a compor B.
- [ ] Dado que o plano não é o padrão e está vazio, quando o excluo, então deixa de existir; tarefas do padrão não são apagadas por excluir outro plano.
- [ ] Dado que não informo título, quando tento criar tarefa ou plano, então a criação é rejeitada.

#### Notas

- Responsáveis: US-02.

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-10"></a>
### US-10 — Tarefas sequenciais e paralelas

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **definir, remover e ajustar relações sequenciais (finish-to-start) ou paralelas**, para **modelar dependências sem conflito**.

#### Critérios de aceite

- [ ] Dado que defino A → B sequencial, quando modelo o plano, então B não inicia antes do fim de A (finish-to-start).
- [ ] Dado que defino A e B paralelas, quando visualizo, então podem sobrepor-se sem dependência mútua obrigatória.
- [ ] Dado que já existe dependência sequencial, quando marco as mesmas como paralelas, então a operação é **rejeitada** até remover a dependência.
- [ ] Dado que removo a dependência sequencial, quando marco como paralelas, então a operação é aceita.
- [ ] Dado que a relação criaria ciclo, quando confirmo, então é rejeitada.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-11"></a>
### US-11 — Aninhar tarefas e roll-up

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **aninhar, desaninhar tarefas e ver roll-up de datas/estado no pai**, para **planejar hierarquia no tempo**.

#### Critérios de aceite

- [ ] Dado que crio filha sob um pai, quando confirmo, então a filha fica subordinada e sem responsável herdado.
- [ ] Dado que uma tarefa é filha, quando a **desaninho**, então deixa de ter aquele pai e permanece no plano.
- [ ] Dado que adiciono níveis, quando confirmo, então não há limite de profundidade; ciclos são rejeitados.
- [ ] Dado que os filhos têm datas, quando consulto o pai, então início = min(inícios) e fim = max(fins) dos filhos com data.
- [ ] Dado que altero datas de um filho, quando consulto o pai, então o roll-up é recalculado.
- [ ] Dado que algum filho está `falhou`, quando consulto o estado agregado do pai, então o pai reflete falha agregada.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-12"></a>
### US-12 — Execução de planos via AIs

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **executar o plano só nas tarefas com IA, cancelar e retentar**, para **orquestrar parcialmente com controle**.

#### Critérios de aceite

- [ ] Dado que o plano tem tarefas com e sem IA, quando executo via AIs, então **somente** as com responsável IA passam de `pendente` para `em execução`.
- [ ] Dado que a IA conclui, quando consulto a tarefa, então status `concluída` e saídas atualizadas.
- [ ] Dado que a IA falha, quando consulto, então `falhou` fica visível; retry só com ação explícita.
- [ ] Dado que o status é `falhou` ou `cancelada`, quando solicito retry, então a tarefa volta a `em execução`.
- [ ] Dado que há execução em andamento, quando cancelo, então as tarefas afetadas ficam `cancelada`.
- [ ] Dado que não há tarefas com IA, quando solicito execução via AIs, então nada executa automaticamente e o sistema informa a ausência.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-13"></a>
### US-13 — Flow Oriented Programming

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **definir, ligar e remover artefatos de estado e procedimentos**, para **modelar FOP no Gantt**.

#### Critérios de aceite

- [ ] Dado que defino entrada/saída com nome e referência, quando visualizo a tarefa, então o artefato aparece.
- [ ] Dado que ligo saída de A à entrada de B, quando visualizo o fluxo, então a conexão fica evidenciada.
- [ ] Dado que existe uma ligação, quando a **desligo**, então A e B deixam de aparecer conectados.
- [ ] Dado que existe um artefato, quando o **removo**, então ele deixa de constar na tarefa.
- [ ] Dado que há saída sem consumidor, quando valido/exporto, então recebo **aviso** (não bloqueia só por órfão).
- [ ] Dado que há **ciclo de estado**, quando valido/exporto, então a operação de exportação útil é **bloqueada**.
- [ ] Dado que defino procedimentos como funções/tarefas, quando consulto o plano, então a lógica do fluxo está expressa.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-14"></a>
### US-14 — Máquina como linguagem no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **programar e executar tarefa com responsável máquina** usando bibliotecas e loops v1, para **tratar o Gantt como linguagem**.

#### Critérios de aceite

- [ ] Dado que a tarefa tem responsável máquina, quando edito, então posso usar bibliotecas `stdio`, `fs`, `http` e loops `for`/`while`, com estados entrada/saída.
- [ ] Dado que o programa é válido, quando executo a tarefa máquina, então ela corre e atualiza saídas/status de conclusão.
- [ ] Dado que uso biblioteca ou sintaxe fora do conjunto v1, quando salvo, então o sistema rejeita ou sinaliza erro.
- [ ] Dado que a tarefa não tem responsável máquina, quando edito, então não é tratada como linguagem nesse paradigma.
- [ ] Dado que o programa é inválido, quando salvo ou executo, então rejeita ou sinaliza erro.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-15"></a>
### US-15 — Exportar código e linguagem visual unificada

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **compilar em FOP-IR e exportar para TypeScript ou Python**, para **usar o plano como programa redundante**.

#### Critérios de aceite

- [ ] Dado que o plano é consistente (sem ciclo de estado), quando **compilo**, então obtenho **FOP-IR** correspondente ao plano.
- [ ] Dado que tenho FOP-IR e escolho TypeScript ou Python, quando exporto, então obtenho artefato na linguagem escolhida.
- [ ] Dado que exporto direto para TypeScript ou Python, quando a operação completa, então o artefato equivale ao obtido via FOP-IR.
- [ ] Dado que escolho linguagem não suportada em v1, quando exporto, então a operação é rejeitada.
- [ ] Dado que o plano está vazio ou bloqueado por inconsistência grave, quando compilo/exporto, então não há artefato útil.
- [ ] Dado que há só órfãos de saída, quando exporto, então a exportação segue com **aviso**.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="ep-03"></a>
## EP-03 — Árvore de execução

<a id="us-16"></a>
### US-16 — Visualizar árvore e responsáveis

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
- [ ] Dado que o procedimento da árvore é inválido, quando salvo, então o sistema rejeita ou sinaliza erro.
- [ ] Dado que a execução está vazia, quando abro a árvore, então está vazia e utilizável.
- [ ] Dado que haveria ciclo, quando a estrutura é apresentada, então ciclo não é estrutura válida.

#### Notas

- Atribuição: US-02. Libs/loops completos: US-14 (Gantt).

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-17"></a>
### US-17 — Criar atividades e hierarquia infinita

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **criar, desaninhar e excluir atividades raiz e filhas com título**, para **decompor a execução sem limite de profundidade**.

#### Critérios de aceite

- [ ] Dado que informo título, quando crio atividade raiz, então ela aparece como raiz adicional (floresta).
- [ ] Dado que existe qualquer atividade, quando crio filha com título, então fica subordinada e sem responsável herdado.
- [ ] Dado que uma atividade é filha, quando a **desaninho**, então pode tornar-se raiz ou subordinar-se a outro pai sem ciclo.
- [ ] Dado que não informo título, quando tento criar, então a criação é rejeitada.
- [ ] Dado que adiciono níveis ou tentaria ciclo, quando confirmo, então profundidade é aceita e ciclo é rejeitado.
- [ ] Dado que excluo uma atividade com filhos, quando confirmo, então a subárvore deixa de aparecer como ativa (alinhado a US-01).

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="ep-04"></a>
## EP-04 — Explorar

<a id="us-18"></a>
### US-18 — Persistir e abrir no Explorar

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | ready |
| Persona | usuário |

#### História

Como **usuário**, quero **persistir toda unidade como arquivo e abri-la no Explorar a partir de qualquer visão**, para **navegar a mesma entidade**.

#### Critérios de aceite

- [ ] Dado que crio unidade em qualquer visão, quando consulto o Explorar, então o arquivo existe com o mesmo UUID.
- [ ] Dado que estou no board, Gantt ou árvore, quando peço abrir no Explorar, então chego ao mesmo arquivo.
- [ ] Dado que a unidade foi arquivada, quando abro o Explorar, então o arquivo ainda está acessível.
- [ ] Dado que estou no Explorar em um arquivo, quando peço abrir no board, Gantt ou árvore, então chego à mesma unidade na visão pedida.
- [ ] Dado que a persistência falha, quando crio/atualizo, então sou informado e não fica como sucesso.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).

---

<a id="us-19"></a>
### US-19 — Lista, busca e navegação por profundidade

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

#### História

Como **usuário**, quero **lista ordenada por título, busca e drill-down com caminho**, para **percorrer a hierarquia de arquivos**.

#### Critérios de aceite

- [ ] Dado que existem unidades, quando abro o Explorar, então a lista está ordenada por **título**.
- [ ] Dado que busco por texto do título, quando executo a busca, então vejo os arquivos correspondentes.
- [ ] Dado que a busca não encontra título, quando executo, então a lista de resultados fica vazia com indicação clara.
- [ ] Dado que há aninhamento, quando faço drill-down, então entro/saio dos níveis sem limite de profundidade e vejo o **caminho (breadcrumb)**.
- [ ] Dado que uso o breadcrumb, quando seleciono um nível ancestral, então volto àquele nível.
- [ ] Dado que o caminho não existe ou a lista está vazia, quando navego, então o sistema informa ausência / lista vazia utilizável.

#### Notas

-

#### Refinamento técnico

Quando `ready`: criar breakdown em [`../tech/refinements/`](../tech/refinements/).
