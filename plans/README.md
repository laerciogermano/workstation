# Plans — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Fundamentos de fluxo: [`inputs/`](inputs/) (FOP — Flow Oriented Programming).

---

## Visão

O Plans é o lugar único onde **intenções** e **roteiros** viram trabalho acompanhável: a **mesma unidade** aparece no Board, no Gantt, na Árvore de execução e no Explorar — com responsáveis tipados (pessoa, IA, máquina) e planos modelados como **linguagem visual de fluxo (FOP)** exportável para código.

**Toda atividade também é um arquivo** na seção **Explorar**, um painel transversal no **estilo de explorador de IDE** (como o do VS Code): a hierarquia de trabalho é navegável como árvore de arquivos, sem duplicar a entidade.

No Gantt, o plano é um **roteiro de mudanças de estado** (Gantt Flow): **dados** (estado) e **funções** (procedimentos) compostos em sequência, paralelo, seleção e repetição — compiláveis via FOP-IR sem reescrever o fluxo em cada linguagem.

## Problema

Ferramentas de gestão impõem hierarquias rígidas e fragmentam a mesma atividade conforme a tela. Quem planeja, executa e explora perde o norte ao trocar de ferramenta ou de vocabulário.

Ferramentas de desenvolvimento e automação, por sua vez, acoplam **roteiro** e **ator**, multiplicam formas redundantes do mesmo fluxo e não oferecem uma **linguagem ubíqua** de fluxo — visual → compilação → exportação — independente de paradigma, plataforma ou linguagem de destino.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Organizador** | Quem organiza o próprio trabalho | Registrar intenções e acompanhar sem trocar de ferramenta |
| **Condutor de projetos** | Quem conduz projetos | Ver a mesma unidade em board, tempo (Gantt), hierarquia e arquivos |
| **Orquestrador** | Quem orquestra IAs | Atribuir responsáveis tipados e acompanhar execução de IAs |
| **Modelador de fluxo** | Quem modela e exporta fluxo como código | Tratar planos como FOP (roteiro) e gerar TypeScript / Python |
| **Administrador do projeto** | Quem mantém o catálogo de atores | Incluir e remover pessoas, IAs e máquinas atribuíveis no projeto |

## Objetivo

Organizar, acompanhar e visualizar o trabalho do projeto em **Board**, **Gantt**, **Árvore de execução** e **Explorar**, com responsáveis tipados e planos tratáveis como **roteiros FOP** — estado + procedimentos, camadas substituíveis e exportação via FOP-IR.

## Proposta de valor

O Plans ajuda a **registrar e acompanhar** atividades — pessoais ou de projeto — na mesma unidade de trabalho, sem trocar de ferramenta conforme a etapa. Quando o trabalho é fluxo, o Gantt deixa de ser só cronograma: vira **linguagem visual de programação orientada a fluxo**.

| Necessidade | O que o Plans faz |
|-------------|-------------------|
| Lembrar o que fazer | Registrar card no board com título (e contexto opcional) |
| Acompanhar progresso | Board, Gantt, árvore ou Explorar sobre a **mesma** unidade |
| Modelar o *como* do fluxo | Compor dados e funções (FOP) no Gantt, com ligações de estado |
| Trocar quem executa sem reescrever o fluxo | Responsável tipado separado do roteiro |
| Reusar o fluxo em código | Compilar FOP-IR e exportar TypeScript / Python |

### Exemplos

**Registrar uma intenção** — *Comprar fone de ouvido*: cria o **card** no board com **título** e, se quiser, **contexto** (*uso diário, cancelamento de ruído, até R$ 500*). A mesma unidade aparece nas demais visões para não se perder o que precisa ser feito.

**Decompor quando fizer sentido** — *Comprar celular* pode virar sub-cards (*Definir orçamento*, *Comparar modelos*, *Escolher loja*, *Comprar*): mesma unidade, hierarquia infinita, progresso visível.

**Modelar e exportar um roteiro** — um plano no Gantt liga **saídas** de uma tarefa às **entradas** de outra (sequencial ou paralelo; com seleção e repetição quando couber). O mesmo roteiro compila em **FOP-IR** e exporta para TypeScript ou Python sem redesenhar o fluxo.

## Princípios

1. **Uma unidade** — mesma entidade em todas as visões; só muda o nome. **Toda atividade é também um arquivo** no Explorar (estilo IDE).
2. **Hierarquia infinita** — aninhamento sem limite de profundidade, sem ciclos.
3. **Responsável tipado** — o tipo define o comportamento permitido; o responsável é o *quem*, não o roteiro.
4. **Roteiro × ator** — o fluxo (o quê / quando / para quê) permanece estável quando se troca pessoa, IA ou máquina.
5. **FOP no Gantt** — fluxo = **estado** (dados / entradas e saídas) + **procedimentos** (funções / tarefas); estruturas de **sequência**, **paralelo**, **seleção** e **repetição**.
6. **Camadas e contexto** — endereços que se conhecem formam uma camada substituível; a execução ocorre quando o **contexto** está completo.
7. **Linguagem visual unificada** — uma composição visual → **FOP-IR** → exportação para outras linguagens.

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

### Responsáveis

**Um** responsável por unidade (ou nenhum). Filho **não herda** responsável do pai. Só itens do **catálogo do projeto** são atribuíveis: pessoas, IAs e máquinas.

O responsável é o **ator** do roteiro: trocar o ator não redefine o fluxo — apenas quem (ou o quê) executa.

| Tipo | Comportamento |
|------|----------------|
| **Pessoa** | Execução humana |
| **IA** | Executa no board e no Gantt; estados `pendente` → `em execução` → `concluída` \| `falhou` \| `cancelada`; retry só por ação explícita |
| **Máquina** | Linguagem de programação no Gantt (libs, loops, estados); procedimento editável na árvore |

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
- Um plano no Gantt expressa FOP (estado + procedimentos + ligações) e exporta via **FOP-IR** para TypeScript e Python.
- Trocar o responsável tipado **não exige redesenhar** o roteiro.
- Responsáveis tipados se comportam conforme o catálogo (IA dispara só em coluna de execução).

## Glossário

| Termo | Significado |
|-------|-------------|
| **Coluna / raia** | Estágio e faixa do board (quantidade livre) |
| **Coluna de execução** | Dispara IA ao receber card com responsável IA |
| **Entrada / saída** | Artefato de estado: **nome + referência** |
| **Plano** | Contêiner nomeado de tarefas + execução no Gantt; o **roteiro** do fluxo |
| **Roteiro** | Descrição de mudanças de estado (dados + funções) independente do ator |
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
- Roteiro e responsável são independentes: reatribuir não altera ligações de estado nem a estrutura do fluxo.

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
