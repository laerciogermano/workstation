# Plans — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Épicos: [`epics/`](epics/README.md).  
Fundamentos de fluxo: [`inputs/`](inputs/README.md) (quando houver).

**URL protótipo:** https://plans.laerciogermano.com/ · deploy: [`deploy/README.md`](deploy/README.md)  
**Marca / logo:** [`marca/`](marca/README.md) · especificação [`marca/logo/LOGO.md`](marca/logo/LOGO.md) (Plans + Flow IDE)

---

## Contexto

O Plans é o **orquestrador de atividades**: o lugar único onde **intenções** e **roteiros** viram trabalho acompanhável — executado por **humano**, **IA** ou **máquina** — e a **mesma unidade** aparece no Board, **Gantt**, **Flow**, **Fluxograma**, Árvore, **Estados** (o que existe), **Metas** (o que se deseja), **Copiloto** (painel direito) e Explorar. Planos são modelados como **linguagem visual de fluxo** exportável para código.

Sistemas também são fluxos de execução: o próprio Plans serve para **codificar sistemas**, não só listas de tarefas. O **agente** de cada atividade é quem (ou o quê) executa — pessoa, modelo de IA (GPT, Claude, etc.) ou biblioteca/máquina — sem misturar o roteiro com o ator.

**Toda atividade também é um arquivo** no **Explorar**, painel transversal no estilo de explorador de IDE. O Explorar tem duas seções: **Planos** (círculo) e **Estados** (cubo) — planos = trabalho; estados = dados atuais (outs).

No **Gantt**, só calendário (barras + deps). **Estados** = o que já existe (`root` → planos → dados/outs). **Metas** = o que se deseja (mesma árvore; folha = alvo + “hoje”). No **Flow**, mesmo visual do Flow IDE (`flow-dev/`, ref. gantt-sample): tabela **Nome · Início · Passos · % feito · Agente** + barras por passo com progresso; **função** = barra, **dado** = ◆ (0 passos), **composição** = barra-resumo, **sequência** = conector, tags **∥ paralelo**, **if** (seleção, tracejado volta) e **↻** repetição; painel **Contexto · camadas** (IA e pessoa = endereço abstrato; máquina = import concreto) e export **JavaScript** no estilo do documento FOP. Dados ◆ só aparecem no Flow e no Explorar. **Gantt**, **Flow**, **Árvore**, **Estados**, **Metas** e **Fluxograma** compartilham zoom/pan. O **Copiloto** é painel fixo à **direita**. Menu de visões **fixo no centro inferior**.

### Problema

Ferramentas de gestão impõem hierarquias rígidas e fragmentam a mesma atividade conforme a tela. Quem planeja, executa e explora perde o norte ao trocar de ferramenta ou de vocabulário.

Ferramentas de desenvolvimento e automação, por sua vez, acoplam **roteiro** e **ator**, multiplicam formas redundantes do mesmo fluxo e não oferecem uma **linguagem ubíqua** de fluxo — visual → compilação → exportação — independente de paradigma, plataforma ou linguagem de destino.

Orquestrações misturam humano, IA e máquina em silos distintos: não há um lugar único para decompor o trabalho em partes sequenciais (com saída→entrada), validar checkpoints e atribuir o agente certo a cada etapa — em vez de despejar o lote inteiro numa única execução de IA.

## Objetivo

Orquestrar, organizar, acompanhar e visualizar o trabalho do projeto em **Board**, **Gantt**, **Flow**, **Fluxograma**, **Árvore**, **Estados**, **Metas**, **Copiloto** e **Explorar** — com agentes tipados (pessoa, IA, máquina/biblioteca) e planos tratáveis como **roteiros FOP** de sistema — estado + procedimentos, camadas substituíveis e exportação via FOP-IR.

### Proposta de valor

O Plans ajuda a **orquestrar e acompanhar** atividades — pessoais, de projeto ou de sistema — na mesma unidade de trabalho, sem trocar de ferramenta conforme a etapa ou o tipo de agente. Quando o trabalho é fluxo, o Gantt deixa de ser só cronograma: vira **linguagem visual de programação orientada a fluxo** e meio de **codificar sistemas** como planos executáveis.

| Necessidade | O que o Plans faz |
|-------------|-------------------|
| Lembrar o que fazer | Registrar card no board com título (e contexto opcional) |
| Acompanhar progresso | Board, Gantt, árvore ou Explorar sobre a **mesma** unidade |
| Orquestrar humano + IA + máquina | Um plano, vários agentes tipados; cada etapa com o executor certo |
| Encadear execuções (incl. IA→IA) | Saída de uma etapa vira entrada da próxima; partes em sequência em vez de um único prompt monolítico |
| Modelar o *como* do fluxo / sistema | Compor dados e funções (FOP) no Gantt, com ligações de estado |
| Trocar quem executa sem reescrever o fluxo | Agente tipado separado do roteiro |
| Validar por partes (humano ou IA) | Dividir atividades em etapas; cada conclusão é um checkpoint |
| Reusar o fluxo em código | Compilar FOP-IR e exportar TypeScript / Python |

### Exemplos

**Registrar uma intenção** — *Comprar fone de ouvido*: cria o **card** no board com **título** e, se quiser, **contexto** (*uso diário, cancelamento de ruído, até R$ 500*). A mesma unidade aparece nas demais visões para não se perder o que precisa ser feito.

**Decompor para validar por partes** — *Comprar celular* vira sub-cards (*Definir orçamento*, *Comparar modelos*, *Escolher loja*, *Comprar*): mesma unidade, hierarquia infinita, progresso visível. Mesmo quando o responsável é **IA**, a divisão em partes permite validação parcial, alimenta a etapa seguinte com o resultado da anterior e reduz a chance de erro em cascata — em vez de jogar todos os arquivos/prompts numa única tarefa.

**Orquestrar agentes mistos** — um plano mistura etapas humanas (revisão), de IA (rascunho) e de máquina (biblioteca `http` / `fs`): o roteiro é o mesmo; muda só o agente de cada nó.

**Modelar e exportar um sistema** — um plano no Gantt liga **saídas** de uma tarefa às **entradas** de outra (sequencial ou paralelo; com seleção e repetição quando couber). O mesmo roteiro compila em **FOP-IR** e exporta para TypeScript ou Python sem redesenhar o fluxo.

## Personas

| Persona | Para quem | Necessidade | Épicos |
|---------|-----------|-------------|--------|
| **Organizador** | Quem organiza o próprio trabalho | Registrar intenções e acompanhar sem trocar de ferramenta | EP-01 a EP-03, EP-09, EP-10 |
| **Condutor de projetos** | Quem conduz projetos | Ver a mesma unidade em board, tempo, hierarquia e arquivos | EP-01 a EP-04, EP-08 a EP-10 |
| **Orquestrador** | Quem orquestra atividades de humanos, IAs e máquinas | Atribuir agentes, encadear etapas e acompanhar a execução | EP-01 a EP-07, EP-09, EP-10 |
| **Modelador de fluxo** | Quem modela e exporta fluxo como código | Tratar planos como roteiro de sistema e gerar TypeScript ou Python | EP-01 a EP-04, EP-07 a EP-10 |
| **Administrador do projeto** | Quem mantém o catálogo de atores | Incluir e remover pessoas, IAs e máquinas | EP-01 a EP-03, EP-05 |

## Épicos

Os épicos são cumulativos: cada um parte do que os anteriores entregaram. A lista abaixo é o escopo do produto; o [protótipo](prototipo/index.html) mostra uma parte dele, separado por épico, com filtros de persona e de épico no modo navegável.

| ID | Épico | Intenção | Telas |
|----|-------|----------|-------|
| [EP-01](epics/EP-01-arvore-de-execucao.md) | Árvore de execução | Árvore com todas as atividades pais e filhas | T-40, T-41 |
| [EP-02](epics/EP-02-explorar.md) | Explorar | Criar uma árvore de componentes parecida com IDE | T-01 a T-05 |
| [EP-03](epics/EP-03-board.md) | Board | Para cada arquivo, saber o status | T-10, T-11, T-12, T-20 |
| [EP-04](epics/EP-04-gantt.md) | Gantt | Controle de sequência e paralelismo das atividades | T-30 |
| [EP-05](epics/EP-05-responsaveis.md) | Responsáveis | Dizer quem ou o quê executa cada atividade | T-21, T-50, T-51 |
| [EP-06](epics/EP-06-execucao-por-ia.md) | Execução por IA | Fazer a IA trabalhar só onde couber, com falha visível | T-31 |
| [EP-07](epics/EP-07-flow-e-fluxograma.md) | Flow e fluxograma | Descrever o plano como roteiro de sistema | T-32, T-37, T-36 |
| [EP-08](epics/EP-08-maquina-e-exportacao.md) | Máquina e exportação | Programar a etapa de máquina e levar o fluxo para código | T-33, T-42, T-35 |
| [EP-09](epics/EP-09-estados-e-metas.md) | Estados e metas | Separar o que já existe do que se deseja | T-06, T-70, T-80 |
| [EP-10](epics/EP-10-copiloto.md) | Copiloto | Conversar sobre um arquivo sem sair da visão | T-60, T-61 |

### EP-01 · Árvore de execução

**Personas:** Todas consultam; criar, remover e atribuir: Condutor.

- F01 · Criar nó raiz ou filho, com título obrigatório
- F02 · Remover o nó e a subárvore, com confirmação quando houver filhos
- F03 · Atribuir responsável ao nó
- F04 · Atribuir descrição ao nó
- F05 · Zoom e pan
- F06 · Minimizar e expandir ramos, um a um ou todos de uma vez
- F07 · Renomear o nó no próprio título
- F08 · Arrastar e soltar para reordenar, aninhar e desaninhar, sem ciclos
- F09 · Definir o status: To do, Doing ou Done

### EP-02 · Explorar

**Personas:** Todas (operações na árvore: Organizador e Condutor).

- Painel fixo à esquerda, com a hierarquia navegável como árvore de arquivos
- Toda atividade é um arquivo, com o mesmo UUID das outras visões
- Criar arquivo e pasta, renomear, duplicar, recortar, copiar e colar
- Mover por arrastar e soltar, reordenar irmãos e bloquear ciclos
- Menu de contexto, atalhos de teclado e seleção múltipla
- Buscar e filtrar pelo título, abrindo o caminho até o resultado
- Expandir e recolher, copiar caminho e revelar um item na árvore
- Remover com confirmação quando houver filhos

### EP-03 · Board

**Personas:** Organizador, Condutor, Orquestrador, Modelador (Administrador só consulta).

- Cards em colunas e raias, em quantidade livre
- Criar card com título obrigatório e contexto opcional
- Mover cards entre quaisquer colunas e raias; mover o pai leva a subárvore
- Aninhar e desaninhar sem limite de profundidade
- Adicionar, renomear, reordenar e remover colunas e raias vazias
- Detalhe da unidade: título, contexto, datas, hierarquia e “Abrir em”
- Arquivar, desarquivar e excluir em todas as visões

### EP-04 · Gantt

**Personas:** Condutor, Orquestrador, Modelador.

- Planos nomeados e plano padrão do projeto
- Datas de início e fim, com duração derivada
- Barras no calendário, com hoje marcado
- Relações sequenciais (fim para início) e paralelas
- Roll-up de datas e de falha no pai
- Tarefas sem data listadas e sinalizadas
- Zoom e pan

### EP-05 · Responsáveis

**Personas:** Orquestrador (atribui), Administrador (catálogo).

- Catálogo do projeto com pessoas, IAs e máquinas
- Incluir item no catálogo e remover o que não está em uso
- Bloquear a remoção de item em uso e listar onde ele é usado
- Atribuir, trocar ou remover um responsável por unidade
- Filho não herda o responsável do pai
- Trocar o responsável sem redesenhar o roteiro

### EP-06 · Execução por IA

**Personas:** Orquestrador.

- Marcar colunas do Board como de execução
- Disparar ao mover um card com responsável IA para a coluna de execução
- “Executar via IAs” no plano, só nas tarefas pendentes de IA
- Estados pendente, em execução, concluída, falhou e cancelada
- Cancelar o que está rodando
- Nova tentativa só por ação explícita
- Saída de uma etapa vira entrada da próxima

### EP-07 · Flow e fluxograma

**Personas:** Modelador (Flow também para o Orquestrador).

- Função, dado e composição, com entradas e saídas
- Ligação de saída com entrada
- Sequência, paralelo, seleção e repetição
- Endereços concretos e abstratos em camadas substituíveis
- Checagem de contexto completo, ciclo de estado e saída órfã
- Fluxograma em canvas de nós, com portas, fios, zoom e pan

### EP-08 · Máquina e exportação

**Personas:** Modelador (procedimento na Árvore também para o Condutor).

- Editor de procedimento no Flow, com bibliotecas stdio, fs e http
- Laços for e while, execução da etapa e console
- Edição parcial do procedimento na Árvore
- Compilar o plano consistente em FOP-IR
- Exportar TypeScript e Python, com prévia e download
- Bloquear com ciclo ou contexto incompleto; avisar saída órfã

### EP-09 · Estados e metas

**Personas:** Condutor, Orquestrador, Modelador (Metas: Organizador e Condutor).

- Seção Estados no Explorar, com cada saída como dado
- Visão Estados: árvore root, planos e dados atuais
- Visão Metas: mesma árvore, com o alvo em cada folha e o valor de hoje
- Abrir um estado a partir do Explorar, com destaque
- Zoom, pan e atalho para o Gantt

### EP-10 · Copiloto

**Personas:** Organizador, Condutor, Orquestrador, Modelador.

- Painel fixo à direita, aberto e fechado pelo ícone de chat
- Várias abas, cada uma ligada a um arquivo
- Nova aba a partir do arquivo selecionado no Explorar
- Resposta com o contexto do arquivo (simulada no protótipo)

## Princípios

1. **Uma unidade** — mesma entidade em todas as visões; só muda o nome. **Toda atividade é também um arquivo** no Explorar (estilo IDE).
2. **Hierarquia infinita** — aninhamento sem limite de profundidade, sem ciclos.
3. **Partes antes do todo** — dividir atividades em etapas (especialmente IA); saída de uma parte alimenta a entrada da próxima; validação parcial diminui erros em cascata frente a um único lote monolítico.
4. **Agente tipado** — o tipo define o comportamento permitido; o agente é o *quem* (pessoa, modelo de IA ou biblioteca/máquina), não o roteiro.
5. **Roteiro × ator** — o fluxo (o quê / quando / para quê) permanece estável quando se troca pessoa, IA ou máquina.
6. **Plans como orquestrador** — o mesmo mecanismo orquestra humanos, IAs e máquinas; sistemas são fluxos de execução codificados no plano.
7. **FOP no Gantt** — fluxo = **estado** (dados / entradas e saídas) + **procedimentos** (funções / tarefas); estruturas de **sequência**, **paralelo**, **seleção** e **repetição**.
8. **Camadas e contexto** — endereços que se conhecem formam uma camada substituível; a execução ocorre quando o **contexto** está completo.
9. **Linguagem visual unificada** — uma composição visual → **FOP-IR** → exportação para outras linguagens; várias visualizações (board/todo, Gantt, árvore, Explorar) sobre o mesmo modelo.

## Fora de escopo (v1)

- Merge de unidades
- WIP limits e permissões de caminho no board
- Paridade total de bibliotecas/loops da máquina na árvore
- Destinos de exportação além de **TypeScript** e **Python**

## Modelo conceitual

### Unidade de trabalho

A mesma entidade, com **id canônico (UUID)** estável, muda só de rótulo conforme a visão:

| Visão | Nome |
|-------|------|
| Board | **card** |
| Gantt | **tarefa** (**ordem**) |
| Árvore de execução | **atividade** (**nó**) |
| Explorar | **arquivo** |

Alteração em uma visão reflete nas demais. **Toda atividade** (e toda unidade criada em qualquer visão) **também é um arquivo** na seção **Explorar**, no padrão de um **explorador de arquivos de IDE**: mesma identidade (UUID), sem cópia paralela.

**Campos mínimos:** **título** obrigatório; **contexto** opcional (orienta humano ou IA).

**Ciclo de vida:** **excluir** remove em todas as visões; **arquivar** oculta do fluxo ativo e mantém no Explorar.

### Responsáveis (agentes)

**Um** responsável por unidade (ou nenhum). Filho **não herda** responsável do pai. Só itens do **catálogo do projeto** são atribuíveis: pessoas, IAs e máquinas.

O responsável é o **agente** (ator) do roteiro: trocar o agente não redefine o fluxo — apenas quem (ou o quê) executa. Em programação o agente é a **biblioteca**/runtime; na atividade humana, a **pessoa**; na automação generativa, o **modelo** (GPT, Claude, etc.).

| Tipo | Agente | Comportamento |
|------|--------|----------------|
| **Pessoa** | Humano | Execução humana |
| **IA** | Modelo (GPT, Claude, …) | Executa no board e no Gantt; estados `pendente` → `em execução` → `concluída` \| `falhou` \| `cancelada`; retry só por ação explícita; etapas encadeadas passam saída→entrada |
| **Máquina** | Biblioteca / procedimento | Linguagem de programação no Gantt (libs, loops, estados); procedimento editável na árvore |

### Fluxo (FOP)

Um **roteiro** (plano no Gantt) descreve mudanças de estado:

| Conceito | Significado no Plans |
|----------|----------------------|
| **Dado** | Unidade de informação; o **estado** agrupa dados (entradas/saídas) |
| **Função / procedimento** | Unidade de mudança de estado (tarefa ou bloco no fluxo) |
| **Entrada / saída** | Artefato de estado: **nome + referência**; ligação saída→entrada conecta o fluxo |
| **Endereço** | Identidade do dado ou da função (concreto ou abstrato) |
| **Camada** | Unidade substituível; endereços que se conhecem compartilham camada |
| **Contexto** | Conjunto de entradas (dados e funções) necessário para executar |

**Estruturas de fluxo (v1):** sequencial (finish-to-start), paralelo, seleção e repetição (`for`, `while` na máquina).  
**Compilação:** plano consistente → **FOP-IR** → TypeScript ou Python. Ciclo de estado **bloqueia** exportação útil; saídas órfãs geram **aviso**.

## Critérios de sucesso

- Uma intenção registrada permanece a **mesma unidade** ao mudar de Board ↔ Gantt ↔ Árvore ↔ Explorar.
- É possível ir de intenção → conclusão/arquivo **sem trocar de ferramenta**.
- Um plano orquestra etapas de **pessoa**, **IA** e **máquina** no mesmo roteiro.
- Um plano no Gantt expressa FOP (estado + procedimentos + ligações), codifica o sistema como fluxo e exporta via **FOP-IR** para TypeScript e Python.
- Trocar o agente tipado **não exige redesenhar** o roteiro.
- Agentes tipados se comportam conforme o catálogo (IA dispara só em coluna de execução).
- Atividades (incl. as feitas por IA) podem ser **divididas em partes** com saída→entrada e validação parcial entre etapas, em vez de um único lote monolítico.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Agente** | Quem executa a unidade: pessoa, modelo de IA ou biblioteca/máquina |
| **Coluna / raia** | Estágio e faixa do board (quantidade livre) |
| **Coluna de execução** | Dispara IA ao receber card com responsável IA |
| **Entrada / saída** | Artefato de estado: **nome + referência**; saída de uma etapa pode alimentar a entrada da próxima |
| **Plano** | Contêiner nomeado de tarefas + execução no Gantt; o **roteiro** do fluxo / sistema |
| **Roteiro** | Descrição de mudanças de estado (dados + funções) independente do agente |
| **Orquestração** | Coordenação de etapas e agentes (humano, IA, máquina) sobre o mesmo plano |
| **FOP** | Flow Oriented Programming — programação orientada a fluxo |
| **FOP-IR** | Representação intermediária do fluxo para exportação |
| **Camada** | Unidade substituível de endereços que se conhecem |
| **Contexto** | Entradas necessárias para a execução do fluxo estar completa |

## Regras de negócio (v1)

Detalhamento operacional que épicos e stories devem respeitar. Não redefine a visão acima.

### Transversais

- Id canônico UUID; exclusão global; arquivar ≠ excluir; merge fora de escopo.
- Título obrigatório; contexto opcional.
- Um responsável; sem herança pai→filho; só catálogo do projeto.
- Hierarquia sem ciclos.
- Preferir decompor atividades em partes (incl. responsável IA) para validação parcial e encadeamento saída→entrada entre etapas, em vez de um único lote monolítico.
- Roteiro e agente são independentes: reatribuir não altera ligações de estado nem a estrutura do fluxo.
- O mesmo plano pode misturar agentes pessoa, IA e máquina.

### Board

- Remover coluna/raia **bloqueada** se houver cards (esvaziar antes).
- Mover pai move a **subárvore** (pai + descendentes).
- Sem WIP / permissões de caminho em v1: qualquer coluna/raia válida.
- Só **coluna de execução** + responsável **IA** dispara execução automática.

### Gantt / FOP / IA

- Tarefa pertence a um **plano** (plano padrão do projeto se não informado).
- Datas: **início + fim** (fuso do projeto); duração derivada; sem datas → listada, não posicionada (sinalizada).
- Sequencial = **finish-to-start**.
- Paralelo com dependência sequencial existente → **rejeitar** até remover a dependência.
- Seleção e repetição fazem parte do modelo FOP; na máquina v1, loops explícitos: `for`, `while`.
- Roll-up: pai = min(início)…max(fim) dos filhos com data; estado agrega falha se algum filho falhou.
- Artefato = nome + referência; ligar saídas **opcional**; ciclo de estado bloqueia; órfãos geram **aviso** na exportação.
- Endereços concretos e abstratos são admitidos no modelo; camadas substituíveis não misturam conhecimentos cruzados indevidos.
- Execução do fluxo (máquina / exportação coerente) pressupõe **contexto completo**.
- Bibliotecas v1: `stdio`, `fs`, `http`.
- Exportação: **FOP-IR**; destinos v1: **TypeScript**, **Python**.
- Execução via AIs: só tarefas com responsável IA; **cancelar** → `cancelada`.

### Árvore / Explorar

- Múltiplas raízes permitidas.
- **Toda atividade é arquivo no Explorar:** criar, alterar ou excluir uma atividade em qualquer visão reflete no nó correspondente da árvore de arquivos (e vice-versa).
- Explorar: painel **estilo explorador de IDE**; lista em **árvore** embutida (não é tela); drill-down infinito; Configurações fixas embaixo.
- Explorar **fixo**, altura da **viewport**, com **overflow vertical e horizontal** na área da árvore.
- **Título sempre legível** em qualquer profundidade (incl. >20 níveis): indentação não pode ocultar o texto.
