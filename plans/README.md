# Plans — Documento de visão

Fonte do *quê* e do *porquê* do produto.  
Derivados: [`docs/`](docs/) (`epics` → `stories` → `board` → `tech`).

---

## Visão

O Plans é o lugar único onde intenções viram trabalho acompanhável: a **mesma unidade** aparece no Board, no Gantt, na Árvore de execução e no Explorar — com responsáveis tipados (pessoa, IA, prestador, máquina) e planos exportáveis como linguagem de programação (FOP).

## Problema

Ferramentas de gestão impõem hierarquias rígidas e fragmentam a mesma atividade conforme a tela. Quem planeja, executa e explora perde o norte ao trocar de ferramenta ou de vocabulário.

Além disso, desenvolver o mesmo fluxo de forma **redundante em múltiplas linguagens** exige uma **estrutura unificada** (linguagem visual → compilação → exportação) que as ferramentas atuais não oferecem.

## Para quem

| Persona | Necessidade |
|---------|-------------|
| Quem organiza o próprio trabalho | Registrar intenções, acompanhar e decidir sem trocar de ferramenta |
| Quem conduz projetos | Ver a mesma unidade em board, tempo (Gantt), hierarquia e arquivos |
| Quem orquestra IAs e prestadores | Atribuir responsáveis tipados e acompanhar execução / chamados |
| Quem exporta fluxo como código | Tratar planos como FOP e gerar TypeScript / Python |

## Objetivo

Organizar, acompanhar e visualizar o trabalho do projeto em **Board**, **Gantt**, **Árvore de execução** e **Explorar**, com responsáveis tipados e planos tratáveis como linguagem de programação exportável (FOP).

## Proposta de valor

O Plans ajuda a **registrar, acompanhar e decidir** atividades — pessoais ou de projeto — na mesma unidade de trabalho, sem trocar de ferramenta conforme a etapa.

| Necessidade | O que o Plans faz |
|-------------|-------------------|
| Lembrar o que fazer | Registrar atividade com título (e contexto opcional) |
| Entender opções antes de agir | IA pesquisa e consolida comparativo estruturado |
| Acompanhar progresso | Board, Gantt, árvore ou Explorar sobre a **mesma** unidade |
| Decidir e encerrar | Registrar escolha na atividade e arquivar ou concluir |

### Exemplos

**Registrar uma intenção** — *Comprar fone de ouvido*: cria a atividade com **título** e, se quiser, **contexto** (*uso diário, cancelamento de ruído, até R$ 500*). Ela aparece no board (ou em outra visão) para não se perder o que precisa ser feito.

**Pesquisar antes de decidir** — *Comprar celular*: registra a atividade, atribui uma **IA** do catálogo e solicita **pesquisa assistida** (melhores aparelhos, benefícios, faixas de preço, ofertas). O resultado vira **saída estruturada** (comparativo) ligada à mesma unidade — no board e no Explorar — para apoiar a decisão sem sair do fluxo.

**Decompor quando fizer sentido** — *Comprar celular* pode virar sub-atividades (*Definir orçamento*, *Comparar modelos*, *Escolher loja*, *Comprar*): mesma unidade, hierarquia infinita, progresso visível.

## Princípios

1. **Uma unidade** — mesma entidade em todas as visões; só muda o nome.
2. **Hierarquia infinita** — aninhamento sem limite de profundidade, sem ciclos.
3. **Responsável tipado** — o tipo define o comportamento permitido.
4. **FOP no Gantt** — **estado** (entradas/saídas) + **procedimentos** (funções/tarefas).
5. **Linguagem visual unificada** — compilação única e exportação para outras linguagens.

## Escopo da visão

### Capacidades

| Área | Em escopo |
|------|-----------|
| **Gestão de atividades** | Registrar com contexto; pesquisa assistida por IA; registrar decisão |
| **Board** | Colunas e raias; cards; coluna de execução; chamados com prestadores |
| **Gantt** | Ordens no tempo; sequencial/paralelo; planos; FOP; exportação |
| **Árvore de execução** | Floresta (múltiplas raízes); hierarquia infinita; responsáveis |
| **Explorar** | Persistência como arquivo; busca; drill-down e breadcrumb |

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

Alteração em uma visão reflete nas demais. Toda unidade persiste como **arquivo** no Explorar.

**Campos mínimos:** **título** obrigatório; **contexto** opcional (orienta humano ou IA). **Chamado** exige também **necessidade** e **serviço desejado**.

**Ciclo de vida:** **excluir** remove em todas as visões; **arquivar** oculta do fluxo ativo e mantém no Explorar.

### Responsáveis

**Um** responsável por unidade (ou nenhum). Filho **não herda** responsável do pai. Só itens do **catálogo do projeto** são atribuíveis: pessoas, IAs, prestadores, máquinas.

| Tipo | Comportamento |
|------|----------------|
| **Pessoa** | Execução humana |
| **IA** | Executa no board e no Gantt; pesquisa assistida; estados `pendente` → `em execução` → `concluída` \| `falhou` \| `cancelada`; retry só por ação explícita |
| **Prestador** | Assume, executa e conclui **chamado**; usuário final aceita → `atendido` |
| **Máquina** | Linguagem de programação no Gantt (libs, loops, estados); procedimento editável na árvore |

## Critérios de sucesso

- Uma intenção registrada permanece a **mesma unidade** ao mudar de Board ↔ Gantt ↔ Árvore ↔ Explorar.
- É possível ir de intenção → pesquisa assistida → decisão → conclusão/arquivo **sem trocar de ferramenta**.
- Planos no Gantt exportam via **FOP-IR** para TypeScript e Python.
- Responsáveis tipados se comportam conforme o catálogo (IA dispara só em coluna de execução; chamado fecha com aceite do usuário).

## Glossário

| Termo | Significado |
|-------|-------------|
| **Coluna / raia** | Estágio e faixa do board (quantidade livre) |
| **Coluna de execução** | Dispara IA ao receber card com responsável IA |
| **Chamado** | Card com necessidade e serviço desejado |
| **Entrada / saída** | Artefato de estado: **nome + referência**; saída de pesquisa assistida = comparativo |
| **Plano** | Contêiner nomeado de tarefas + execução no Gantt |
| **FOP-IR** | Representação intermediária do fluxo para exportação |

## Regras de negócio (v1)

Detalhamento operacional que épicos e stories devem respeitar. Não redefine a visão acima.

### Transversais

- Id canônico UUID; exclusão global; arquivar ≠ excluir; merge fora de escopo.
- Título obrigatório; contexto opcional; chamado: + necessidade e serviço.
- Um responsável; sem herança pai→filho; só catálogo do projeto.
- Hierarquia sem ciclos.

### Board

- Remover coluna/raia **bloqueada** se houver cards (esvaziar antes).
- Mover pai move a **subárvore** (pai + descendentes).
- Sem WIP / permissões de caminho em v1: qualquer coluna/raia válida.
- Só **coluna de execução** + responsável **IA** dispara execução automática.
- Chamado visível a **todos os prestadores** do catálogo.
- Prestador conclui → `aguardando aceite`; usuário final aceita → `atendido`.
- Transferência: responsável atual **libera** ou admin **reatribui**.

### Gantt / FOP / IA

- Tarefa pertence a um **plano** (plano padrão do projeto se não informado).
- Datas: **início + fim** (fuso do projeto); duração derivada; sem datas → listada, não posicionada (sinalizada).
- Sequencial = **finish-to-start**.
- Paralelo com dependência sequencial existente → **rejeitar** até remover a dependência.
- Roll-up: pai = min(início)…max(fim) dos filhos com data; estado agrega falha se algum filho falhou.
- Artefato = nome + referência; ligar saídas **opcional**; ciclo de estado bloqueia; órfãos geram **aviso** na exportação.
- Bibliotecas v1: `stdio`, `fs`, `http`; loops: `for`, `while`.
- Exportação: **FOP-IR**; destinos v1: **TypeScript**, **Python**.
- Execução via AIs: só tarefas com responsável IA; **cancelar** → `cancelada`.

### Árvore / Explorar

- Múltiplas raízes permitidas.
- Explorar: ordenação por **título**; busca por título; drill-down + breadcrumb.
