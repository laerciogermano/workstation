# Plans — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Fundamentos de fluxo: [`inputs/`](inputs/) (FOP — Flow Oriented Programming).

---

## Visão

O Plans é o **orquestrador de atividades**: o lugar único onde **intenções** e **roteiros** viram trabalho acompanhável — executado por **humano**, **IA** ou **máquina** — e a **mesma unidade** aparece no Board (quadro/todo), no Gantt, na Árvore de execução e no Explorar. Planos são modelados como **linguagem visual de fluxo (FOP)** exportável para código.

Sistemas também são fluxos de execução: o próprio Plans serve para **codificar sistemas**, não só listas de tarefas. O **agente** de cada atividade é quem (ou o quê) executa — pessoa, modelo de IA (GPT, Claude, etc.) ou biblioteca/máquina — sem misturar o roteiro com o ator.

**Toda atividade também é um arquivo** na seção **Explorar**, um painel transversal no **estilo de explorador de IDE** (como o do VS Code): a hierarquia de trabalho é navegável como árvore de arquivos, sem duplicar a entidade.

No Gantt, o plano é um **roteiro de mudanças de estado** (Gantt Flow): **dados** (estado) e **funções** (procedimentos) compostos em sequência, paralelo, seleção e repetição — compiláveis via FOP-IR sem reescrever o fluxo em cada linguagem. Em cadeias sequenciais, a **saída** de uma etapa alimenta a **entrada** da seguinte — inclusive entre execuções de IA, em vez de empurrar o trabalho inteiro numa única tarefa.

## Problema

Ferramentas de gestão impõem hierarquias rígidas e fragmentam a mesma atividade conforme a tela. Quem planeja, executa e explora perde o norte ao trocar de ferramenta ou de vocabulário.

Ferramentas de desenvolvimento e automação, por sua vez, acoplam **roteiro** e **ator**, multiplicam formas redundantes do mesmo fluxo e não oferecem uma **linguagem ubíqua** de fluxo — visual → compilação → exportação — independente de paradigma, plataforma ou linguagem de destino.

Orquestrações misturam humano, IA e máquina em silos distintos: não há um lugar único para decompor o trabalho em partes sequenciais (com saída→entrada), validar checkpoints e atribuir o agente certo a cada etapa — em vez de despejar o lote inteiro numa única execução de IA.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Organizador** | Quem organiza o próprio trabalho | Registrar intenções e acompanhar sem trocar de ferramenta |
| **Condutor de projetos** | Quem conduz projetos | Ver a mesma unidade em board, tempo (Gantt), hierarquia e arquivos |
| **Orquestrador** | Quem orquestra atividades de humanos, IAs e máquinas | Atribuir agentes tipados, encadear etapas e acompanhar a execução |
| **Modelador de fluxo** | Quem modela e exporta fluxo como código / sistema | Tratar planos como FOP (roteiro de sistema) e gerar TypeScript / Python |
| **Administrador do projeto** | Quem mantém o catálogo de atores | Incluir e remover pessoas, IAs e máquinas atribuíveis no projeto |

## Objetivo

Orquestrar, organizar, acompanhar e visualizar o trabalho do projeto em **Board**, **Gantt**, **Árvore de execução** e **Explorar** — com agentes tipados (pessoa, IA, máquina/biblioteca) e planos tratáveis como **roteiros FOP** de sistema — estado + procedimentos, camadas substituíveis e exportação via FOP-IR.

## Proposta de valor

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

## Escopo da visão

### Capacidades

| Área | Em escopo |
|------|-----------|
| **Visões** | Menu transversal **ao lado do conteúdo** (não no Explorar); **fixo no topo**, **centralizado**; Board · Gantt · Árvore |
| **Gestão de atividades** | Cards no board (título + contexto) |
| **Board** | Colunas e raias; cards; coluna de execução |
| **Gantt** | Ordens no tempo; sequencial/paralelo/seleção/repetição; planos; FOP; exportação |
| **Árvore de execução** | Floresta (múltiplas raízes); hierarquia infinita; responsáveis |
| **Explorar** | Painel transversal **estilo explorador de IDE**; **toda atividade** materializa-se como **arquivo** na árvore; lista embutida (não é tela); Configurações fixas embaixo |

### Fora de escopo (v1)

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
