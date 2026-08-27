# Cenários BDD — Plans

Critérios de aceite em formato **Dado / Quando / Então** para as histórias em [`user-stories.md`](user-stories.md).

Fontes: [documento de visão](../README.md) e [`../inputs/`](../inputs/) (FOP — Flow Oriented Programming).

---

## US-01 — Mesma unidade, vocabulário e ciclo de vida

Como **organizador**, quero **que toda atividade tenha um id canônico (UUID) estável, apareça com o nome certo em cada visão (card no Board, tarefa no Gantt, atividade/nó na Árvore, arquivo no Explorar) e possa ser excluída, arquivada ou desarquivada**, para que **a mesma intenção permaneça reconhecível em qualquer superfície sem perder identidade nem histórico**.

### Cenários

- [ ] Dado que crio uma unidade, quando a consulto em qualquer visão, então ela compartilha o mesmo **UUID**.
- [ ] Dado que estou no Board / Gantt / Árvore / Explorar, quando visualizo a unidade, então o rótulo é card / tarefa / atividade (nó) / arquivo.
- [ ] Dado que altero o **título** em uma visão, quando consulto outra, então o título está refletido.
- [ ] Dado que **excluo** a unidade, quando abro qualquer visão, então ela não aparece como ativa em nenhuma.
- [ ] Dado que a unidade tem filhos, quando a **excluo**, então a unidade e a subárvore deixam de aparecer como ativas em todas as visões.
- [ ] Dado que **arquivo** a unidade, quando uso o fluxo ativo, então ela não aparece; quando uso o Explorar, então o arquivo permanece.
- [ ] Dado que a unidade está arquivada, quando **desarquivo**, então ela volta a aparecer no fluxo ativo com o mesmo UUID.
- [ ] Dado que tento **merge** de unidades, quando a operação é solicitada, então não está disponível em v1 (fora de escopo).

---

## US-02 — Atribuir responsável tipado

Como **orquestrador**, quero **atribuir, trocar ou remover um responsável (pessoa, IA ou máquina) a partir do catálogo do projeto, sem herança automática do pai para o filho**, para que **o ator do roteiro fique definido sem redesenhar o fluxo quando eu trocar quem executa**.

### Cenários

- [ ] Dado que o item está no catálogo, quando atribuo pessoa, IA ou máquina, então tipo e identidade ficam visíveis e há no máximo **um** responsável.
- [ ] Dado que a unidade já tem responsável A, quando atribuo B do catálogo, então B substitui A sem alterar ligações de estado nem a estrutura do fluxo.
- [ ] Dado que o item **não** está no catálogo, quando tento atribuir, então a operação é rejeitada.
- [ ] Dado que existe um pai com responsável, quando crio um filho, então o filho **nasce sem** responsável.
- [ ] Dado que o responsável é máquina, quando consulto a unidade, então ela é tratada como linguagem (Gantt: US-13; árvore: procedimento — US-15).
- [ ] Dado que removo o responsável, quando consulto a unidade, então não há responsável e cessam regras exclusivas do tipo anterior.

---

## US-03 — Gerenciar catálogo de responsáveis

Como **administrador do projeto**, quero **incluir e remover pessoas, IAs e máquinas no catálogo do projeto**, para que **somente atores autorizados possam ser atribuídos como responsáveis**.

### Cenários

- [ ] Dado que adiciono pessoa, IA ou máquina ao catálogo, quando um usuário atribui responsável, então o item passa a ser selecionável.
- [ ] Dado que o item está no catálogo e **não** é responsável de nenhuma unidade, quando o removo do catálogo, então deixa de ser atribuível.
- [ ] Dado que o item ainda é responsável de alguma unidade, quando tento removê-lo do catálogo, então a remoção é bloqueada ou exige reatribuição/limpeza antes.
- [ ] Dado que o catálogo está vazio para um tipo, quando tento atribuir esse tipo, então não há opções válidas e a atribuição não completa.

---

## US-04 — Configurar colunas e raias

Como **condutor de projetos**, quero **configurar colunas e raias (swimlanes) em quantidade livre, reordená-las e removê-las somente quando estiverem vazias**, para que **o board reflita o processo do time sem perder cards por remoção indevida**.

### Cenários

- [ ] Dado que o board está vazio de configuração, quando o abro, então posso adicionar a primeira coluna e raia (board utilizável).
- [ ] Dado que configuro o board, quando adiciono N colunas e M raias, então o board as exibe.
- [ ] Dado que existem colunas/raias vazias, quando removo ou reordeno, então a configuração reflete a alteração.
- [ ] Dado que a coluna/raia **contém cards**, quando tento remover, então a remoção é **bloqueada** até esvaziar.
- [ ] Dado que esvaziei a coluna/raia, quando removo, então ela deixa de existir no board.

---

## US-05 — Cadastrar e mover cards

Como **organizador**, quero **cadastrar cards no board com título obrigatório e contexto opcional (orçamento, preferências, restrições) e movê-los entre qualquer coluna e raia válida**, para que **todas as intenções nasçam e sejam acompanhadas no board, sem restrições de WIP ou caminho em v1**.

### Cenários

- [ ] Dado que informo **título**, quando crio o card em coluna e raia, então ele aparece nessa posição.
- [ ] Dado que informo **contexto** opcional, quando salvo o card, então o contexto fica associado à unidade e visível nas visões.
- [ ] Dado que não informo contexto, quando crio o card, então ele é válido só com título.
- [ ] Dado que não informo título, quando tento criar, então a criação é rejeitada.
- [ ] Dado que o card existe, quando altero o título ou o contexto, então a alteração aparece no board e nas demais visões.
- [ ] Dado que o destino é coluna/raia válida, quando movo o card, então ele fica só no destino (sem restrição WIP/caminho em v1).
- [ ] Dado que o destino é inválido, quando tento mover, então o card permanece na origem.

---

## US-06 — Aninhar e mover hierarquia de cards

Como **condutor de projetos**, quero **aninhar cards em hierarquia infinita, desaninhar e mover o pai junto com toda a subárvore**, para que **eu decomponha intenções complexas e reposicione blocos inteiros de trabalho de uma vez**.

### Cenários

- [ ] Dado que existe um card pai, quando crio um filho, então o filho fica subordinado e **sem** responsável herdado.
- [ ] Dado que há cadeia aninhada, quando adiciono nível, então não há limite de profundidade.
- [ ] Dado que o aninhamento criaria ciclo, quando confirmo, então é rejeitado.
- [ ] Dado que um card é filho, quando o **desaninho**, então ele deixa de ter aquele pai e permanece no board.
- [ ] Dado que o pai tem descendentes, quando movo o pai para outra coluna/raia, então **pai e descendentes** vão juntos.

---

## US-07 — Colunas de execução e orquestração de IA

Como **orquestrador**, quero **marcar colunas como de execução e, ao mover para elas um card com responsável IA, disparar a execução com estados `pendente` → `em execução` → `concluída` / `falhou` / `cancelada`, com retry apenas por ação explícita**, para que **IAs trabalhem automaticamente só onde couber, com critério claro de término e falha visível**.

### Cenários

- [ ] Dado que marco colunas como de execução, quando visualizo o board, então elas estão identificadas.
- [ ] Dado que uma coluna é de execução, quando a **desmarco**, então deixa de ser de execução e novos movimentos para ela não disparam IA.
- [ ] Dado que o card tem IA (status `pendente`) e entro em coluna de execução, quando o movimento completa, então a IA inicia (`em execução`) usando título/contexto e entradas ligadas, produzindo/atualizando saídas.
- [ ] Dado que a execução termina com sucesso, quando consulto o card, então o status é `concluída`.
- [ ] Dado que a execução falha, quando consulto o card, então o status é `falhou`, o card permanece na coluna e a falha é visível.
- [ ] Dado que o status é `falhou`, quando solicito **retry**, então a IA tenta de novo; sem ação do usuário, não há retry automático.
- [ ] Dado que a coluna não é de execução ou o responsável não é IA, quando movo o card, então não há disparo automático por IA.
- [ ] Dado que cards já estão na coluna no momento em que a marco como execução, quando a marcação ocorre, então **não** há disparo retroativo automático (só novos movimentos).

---

## US-08 — Planos, ordens e datas

Como **condutor de projetos**, quero **criar planos nomeados, associar tarefas a um plano (ou ao plano padrão do projeto) e definir datas de início e fim no fuso do projeto**, para que **as ordens fiquem organizadas no tempo, com duração derivada e tarefas sem data sinalizadas na lista do Gantt**.

### Cenários

- [ ] Dado que crio um plano nomeado, quando o abro, então ele pode conter tarefas e execução.
- [ ] Dado que crio uma tarefa só com título, quando não informo plano, então ela entra no **plano padrão** do projeto.
- [ ] Dado que a tarefa tem início e fim válidos (fuso do projeto), quando abro o Gantt, então ela fica posicionada; duração é derivada.
- [ ] Dado que altero início ou fim, quando salvo, então a posição no eixo e a duração derivada são atualizadas.
- [ ] Dado que a tarefa não tem datas válidas, quando abro o Gantt, então ela aparece na lista **sem** posição no eixo e sinalizada.
- [ ] Dado que início > fim, quando tento salvar, então a operação é rejeitada.
- [ ] Dado que a tarefa está no plano A, quando a movo para o plano B, então ela deixa A e passa a compor B.
- [ ] Dado que o plano não é o padrão e está vazio, quando o excluo, então deixa de existir; tarefas do padrão não são apagadas por excluir outro plano.
- [ ] Dado que não informo título, quando tento criar tarefa ou plano, então a criação é rejeitada.

---

## US-09 — Tarefas sequenciais e paralelas

Como **modelador de fluxo**, quero **definir relações sequenciais (finish-to-start) e paralelas entre tarefas, removê-las e impedir conflito entre os dois modos**, para que **o roteiro temporal reflita dependências reais sem ciclos nem combinações inválidas**.

### Cenários

- [ ] Dado que defino A → B sequencial, quando modelo o plano, então B não inicia antes do fim de A (finish-to-start).
- [ ] Dado que defino A e B paralelas, quando visualizo, então podem sobrepor-se sem dependência mútua obrigatória.
- [ ] Dado que já existe dependência sequencial, quando marco as mesmas como paralelas, então a operação é **rejeitada** até remover a dependência.
- [ ] Dado que removo a dependência sequencial, quando marco como paralelas, então a operação é aceita.
- [ ] Dado que a relação criaria ciclo, quando confirmo, então é rejeitada.

---

## US-10 — Aninhar tarefas e roll-up

Como **condutor de projetos**, quero **aninhar tarefas em hierarquia infinita no Gantt e ver roll-up de datas e estado no pai (min início, max fim; falha se algum filho falhou)**, para que **subplanos agreguem progresso e prazo sem herança de responsável**.

### Cenários

- [ ] Dado que crio filha sob um pai, quando confirmo, então a filha fica subordinada e sem responsável herdado.
- [ ] Dado que uma tarefa é filha, quando a **desaninho**, então deixa de ter aquele pai e permanece no plano.
- [ ] Dado que adiciono níveis, quando confirmo, então não há limite de profundidade; ciclos são rejeitados.
- [ ] Dado que os filhos têm datas, quando consulto o pai, então início = min(inícios) e fim = max(fins) dos filhos com data.
- [ ] Dado que altero datas de um filho, quando consulto o pai, então o roll-up é recalculado.
- [ ] Dado que algum filho está `falhou`, quando consulto o estado agregado do pai, então o pai reflete falha agregada.

---

## US-11 — Execução de planos via AIs

Como **orquestrador**, quero **executar um plano apenas nas tarefas com responsável IA, cancelar a execução em andamento e retentar tarefas `falhou` ou `cancelada` por ação explícita**, para que **a orquestração automática seja parcial, controlável e transparente sobre o que está rodando**.

### Cenários

- [ ] Dado que o plano tem tarefas com e sem IA, quando executo via AIs, então **somente** as com responsável IA passam de `pendente` para `em execução`.
- [ ] Dado que a IA conclui, quando consulto a tarefa, então status `concluída` e saídas atualizadas.
- [ ] Dado que a IA falha, quando consulto, então `falhou` fica visível; retry só com ação explícita.
- [ ] Dado que o status é `falhou` ou `cancelada`, quando solicito retry, então a tarefa volta a `em execução`.
- [ ] Dado que há execução em andamento, quando cancelo, então as tarefas afetadas ficam `cancelada`.
- [ ] Dado que não há tarefas com IA, quando solicito execução via AIs, então nada executa automaticamente e o sistema informa a ausência.

---

## US-12 — Flow Oriented Programming

Como **modelador de fluxo**, quero **definir entradas e saídas de estado (nome + referência), ligar saídas a entradas, compor procedimentos como funções/tarefas e validar o plano (aviso para saídas órfãs; bloqueio para ciclo de estado)**, para que **o Gantt expresse um roteiro FOP completo — dados + funções — pronto para compilação**.

### Cenários

- [ ] Dado que defino entrada/saída com nome e referência, quando visualizo a tarefa, então o artefato aparece.
- [ ] Dado que ligo saída de A à entrada de B, quando visualizo o fluxo, então a conexão fica evidenciada.
- [ ] Dado que existe uma ligação, quando a **desligo**, então A e B deixam de aparecer conectados.
- [ ] Dado que existe um artefato, quando o **removo**, então ele deixa de constar na tarefa.
- [ ] Dado que há saída sem consumidor, quando valido/exporto, então recebo **aviso** (não bloqueia só por órfão).
- [ ] Dado que há **ciclo de estado**, quando valido/exporto, então a operação de exportação útil é **bloqueada**.
- [ ] Dado que defino procedimentos como funções/tarefas, quando consulto o plano, então a lógica do fluxo está expressa.

---

## US-13 — Máquina como linguagem no Gantt

Como **modelador de fluxo**, quero **programar e executar tarefas com responsável máquina usando bibliotecas v1 (`stdio`, `fs`, `http`), loops (`for`, `while`) e estados de entrada/saída**, para que **o Gantt funcione também como linguagem de programação orientada a fluxo, não só como cronograma**.

### Cenários

- [ ] Dado que a tarefa tem responsável máquina, quando edito, então posso usar bibliotecas `stdio`, `fs`, `http` e loops `for`/`while`, com estados entrada/saída.
- [ ] Dado que o programa é válido, quando executo a tarefa máquina, então ela corre e atualiza saídas/status de conclusão.
- [ ] Dado que uso biblioteca ou sintaxe fora do conjunto v1, quando salvo, então o sistema rejeita ou sinaliza erro.
- [ ] Dado que a tarefa não tem responsável máquina, quando edito, então não é tratada como linguagem nesse paradigma.
- [ ] Dado que o programa é inválido, quando salvo ou executo, então rejeita ou sinaliza erro.

---

## US-14 — Exportar código e linguagem visual unificada

Como **modelador de fluxo**, quero **compilar um plano consistente em FOP-IR e exportar para TypeScript ou Python (direto ou via IR), com aviso para saídas órfãs e rejeição de destinos não suportados em v1**, para que **o mesmo roteiro visual vire código reutilizável sem reescrever o fluxo em cada linguagem**.

### Cenários

- [ ] Dado que o plano é consistente (sem ciclo de estado), quando **compilo**, então obtenho **FOP-IR** correspondente ao plano.
- [ ] Dado que tenho FOP-IR e escolho TypeScript ou Python, quando exporto, então obtenho artefato na linguagem escolhida.
- [ ] Dado que exporto direto para TypeScript ou Python, quando a operação completa, então o artefato equivale ao obtido via FOP-IR.
- [ ] Dado que escolho linguagem não suportada em v1, quando exporto, então a operação é rejeitada.
- [ ] Dado que o plano está vazio ou bloqueado por inconsistência grave, quando compilo/exporto, então não há artefato útil.
- [ ] Dado que há só órfãos de saída, quando exporto, então a exportação segue com **aviso**.

---

## US-15 — Visualizar árvore e responsáveis

Como **condutor de projetos**, quero **ver a floresta de atividades (múltiplas raízes) com responsáveis visíveis e, quando o responsável for máquina, editar o procedimento associado ao nó**, para que **eu entenda a execução hierárquica fora do eixo temporal do Gantt**.

### Cenários

- [ ] Dado que há múltiplas raízes, quando abro a árvore, então todas as raízes e hierarquias aparecem.
- [ ] Dado que nós têm responsáveis, quando visualizo, então os responsáveis ficam visíveis.
- [ ] Dado que o responsável é máquina, quando abro o nó, então posso ver/editar o **procedimento** (sem exigir libs/loops completos do Gantt em v1).
- [ ] Dado que o procedimento da árvore é inválido, quando salvo, então o sistema rejeita ou sinaliza erro.
- [ ] Dado que a execução está vazia, quando abro a árvore, então está vazia e utilizável.
- [ ] Dado que haveria ciclo, quando a estrutura é apresentada, então ciclo não é estrutura válida.

---

## US-16 — Criar atividades e hierarquia infinita

Como **condutor de projetos**, quero **criar atividades raiz e filhas com título, desaninhar, reorganizar pais e excluir subárvores**, para que **a decomposição da execução não tenha limite de profundidade e permaneça livre de ciclos**.

### Cenários

- [ ] Dado que informo título, quando crio atividade raiz, então ela aparece como raiz adicional (floresta).
- [ ] Dado que existe qualquer atividade, quando crio filha com título, então fica subordinada e sem responsável herdado.
- [ ] Dado que uma atividade é filha, quando a **desaninho**, então pode tornar-se raiz ou subordinar-se a outro pai sem ciclo.
- [ ] Dado que não informo título, quando tento criar, então a criação é rejeitada.
- [ ] Dado que adiciono níveis ou tentaria ciclo, quando confirmo, então profundidade é aceita e ciclo é rejeitado.
- [ ] Dado que excluo uma atividade com filhos, quando confirmo, então a subárvore deixa de aparecer como ativa (alinhado a US-01).

---

## US-17 — Persistir e abrir no Explorar

Como **organizador**, quero **que toda unidade persista como arquivo no Explorar e possa ser aberta a partir do Board, Gantt ou Árvore (e vice-versa)**, para que **a mesma entidade seja navegável como arquivo sem duplicar dados**.

### Cenários

- [ ] Dado que crio unidade em qualquer visão, quando consulto o Explorar, então o arquivo existe com o mesmo UUID.
- [ ] Dado que estou no Board, Gantt ou Árvore, quando peço abrir no Explorar, então o arquivo é revelado/destacado na lista em árvore do painel (sem tela própria).
- [ ] Dado que a unidade foi arquivada, quando abro o Explorar, então o arquivo ainda está acessível.
- [ ] Dado que estou no Explorar, quando peço abrir um arquivo no Board, Gantt ou Árvore, então chego à mesma unidade na visão pedida.
- [ ] Dado que a persistência falha, quando crio/atualizo, então sou informado e não fica como sucesso.

---

## US-18 — Lista em árvore e drill-down infinito

Como **organizador**, quero **ver os arquivos numa lista em árvore (componente do painel Explorar, estilo IDE) ordenada por título e expandir níveis sem limite de profundidade**, para que **eu percorra a hierarquia persistida de forma previsível, mesmo com aninhamento infinito**.

### Cenários

- [ ] Dado que existem unidades, quando uso o sistema, então a lista em árvore do painel Explorar está ordenada por **título** em cada nível (componente embutido, não uma tela).
- [ ] Dado que há aninhamento, quando faço drill-down (expandir/recolher) no Explorar, então entro/saio dos níveis sem limite de profundidade.
- [ ] Dado que peço abrir no Explorar a partir de outra visão, quando a ação conclui, então o arquivo é revelado/destacado na lista em árvore do painel (sem abrir tela de detalhe).
- [ ] Dado que a árvore está vazia, quando navego, então o sistema informa ausência / árvore vazia utilizável.

---

## US-19 — Seleção, repetição, camadas e contexto

Como **modelador de fluxo**, quero **compor estruturas de seleção (condicionais) e repetição no roteiro do plano, organizar endereços em camadas substituíveis e garantir que a execução só ocorra com contexto completo**, para que **fluxos condicionais, iterativos e desacoplados (roteiro × ator) sejam modelados no Gantt Flow sem acoplar regras de negócio a hardware ou linguagem de destino**.

### Cenários

- [ ] Dado um plano FOP, quando adiciono uma estrutura de **seleção** (condicional) entre procedimentos, então o roteiro expressa o caminho condicional no Gantt.
- [ ] Dado um plano FOP, quando adiciono **repetição** (`for` / `while` na máquina), então o laço fica modelado no fluxo sem reescrever o roteiro.
- [ ] Dado endereços que se conhecem, quando organizo a composição, então eles compartilham a mesma **camada** substituível.
- [ ] Dado endereços que não se conhecem, quando compõem o fluxo, então permanecem em **camadas distintas**.
- [ ] Dado que o contexto de entradas (dados e funções) está **incompleto**, quando tento executar o fluxo, então a execução não inicia e o sistema indica o que falta.
- [ ] Dado que o **contexto está completo**, quando executo o fluxo, então a execução ocorre conforme o roteiro.
- [ ] Dado que troco o responsável tipado do plano, quando consulto o roteiro, então seleção, repetição, camadas e ligações de estado permanecem inalteradas.
