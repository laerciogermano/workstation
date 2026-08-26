# Plans

Documento de **negócio** do produto. Fonte de verdade do *quê* o Plans é e das regras que o sistema deve respeitar.

Camadas derivadas: [`docs/`](docs/) — épicos → histórias → refinamento técnico.  
Esteira: [`docs/README.md`](docs/README.md).

```text
Negócio (este arquivo) → Épicos → Histórias → Técnico
```

---

## Problema

Ferramentas de gestão de trabalho costumam impor hierarquias rígidas e fragmentar a mesma atividade em conceitos diferentes conforme a tela.

Quem trabalha precisa saber: para onde vai, onde está, o que já foi feito e o que falta — sem perder o fio entre planejar, executar e explorar o trabalho.

Há também a necessidade de desenvolver de forma **redundante em múltiplas linguagens**, a partir de uma **estrutura unificada** (linguagem visual → compilação → exportação).

## Objetivo

O Plans organiza, acompanha e visualiza o trabalho de um projeto por meio de **quatro superfícies**:

| Superfície | Papel |
|------------|--------|
| **Board** | Fluxo de trabalho (colunas e raias) |
| **Gantt** | Planejamento e execução no tempo (ordens, estado, FOP) |
| **Árvore de execução** | Decomposição hierárquica da execução |
| **Explorar** | Persistência e navegação das unidades como arquivos |

Nas superfícies é possível **atribuir responsáveis**, **orquestrar AIs**, **intermediar usuário final e prestadores de serviço** e, quando o responsável for **máquina**, tratar o trabalho como **linguagem de programação** (exportável a partir do Gantt / FOP).

## Princípios

1. **Uma unidade** — toda atividade é a mesma entidade, apenas nomeada conforme a visão.
2. **Hierarquia infinita** — aninhamento sem limite de profundidade (board, Gantt, árvore, Explorar).
3. **Responsável tipado** — pessoa, IA, prestador de serviço ou máquina; o tipo altera o comportamento permitido.
4. **Flow Oriented Programming (FOP)** — no Gantt, o plano combina **estado** (entradas e saídas) e **procedimentos** (funções e tarefas).
5. **Linguagem visual unificada** — o modelo pode ser compilado em uma representação única e exportado para outras linguagens.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Unidade de trabalho** | Entidade única do trabalho no Plans |
| **Card** | Unidade vista no board |
| **Tarefa** / **ordem** | Unidade vista no Gantt |
| **Atividade** / **nó** | Unidade vista na árvore de execução |
| **Arquivo** | Unidade vista e persistida no Explorar |
| **Coluna** | Estágio do fluxo no board |
| **Raia (swimlane)** | Faixa transversal de organização no board |
| **Coluna de execução** | Coluna que dispara execução automática ao receber card com responsável IA |
| **Chamado** | Card que descreve necessidade e serviço desejado para prestadores |
| **Entrada / saída** | Artefatos de **estado** ligados a uma tarefa (FOP) |
| **Plano** | Conjunto de tarefas no Gantt organizado para execução |
| **Máquina** | Tipo de responsável que trata a unidade como linguagem de programação |

## Unidade de trabalho

Toda atividade é **arquivo**, **tarefa**, **nó** ou **card** — a mesma unidade:

| Visão | Nome da unidade |
|-------|-----------------|
| Board | **card** |
| Gantt | **tarefa** |
| Árvore de execução | **atividade** (**nó**) |
| Explorar | **arquivo** |

Alterações na unidade em uma visão refletem nas demais. Não há entidades paralelas para o mesmo trabalho.

## Responsáveis

Toda unidade pode ter **um** responsável, de um destes tipos:

| Tipo | Efeito |
|------|--------|
| **Pessoa** | Execução humana |
| **IA** | Delegação a inteligência artificial; no board, dispara execução automática em **coluna de execução** |
| **Prestador de serviço** | Atendimento intermediado à necessidade do usuário final |
| **Máquina** | A unidade é tratada como **linguagem de programação** |

Regra: se o responsável for **máquina**, Gantt/tarefa e árvore/atividade são tratados como linguagem de programação. No Gantt isso inclui **bibliotecas**, **laços / loops** e **estados** (entradas e saídas).

## Capacidades

### Board

- Configurar **colunas** e **raias** em quantidade livre, conforme o processo do time.
- **Cadastrar**, **atribuir responsável**, **mover** e **aninhar** cards em qualquer profundidade.
- Marcar uma ou mais **colunas de execução**.
- Ao mover um card para coluna de execução, se o responsável for **IA**, a IA **executa automaticamente** o trabalho.
- Orquestrar prestadores: o usuário final cria um **chamado** (necessidade + serviço desejado); o prestador **assume**, **executa** e **atende**.

### Gantt

- Visualizar **tarefas (ordens)** no tempo, com **responsáveis**.
- Visualizar **entradas e saídas** (artefatos de estado).
- Definir tarefas **sequenciais** (ordem/dependência) e **paralelas** (simultâneas).
- Aninhar tarefas em qualquer profundidade.
- **Criar planos** e **executá-los via AIs**.
- Aplicar **FOP**: estado (entradas/saídas) e procedimentos (funções/tarefas).
- Com responsável **máquina**: bibliotecas, loops e estados; **exportar o Gantt como código**.
- Operar como **linguagem visual unificada**: compilar e exportar para demais linguagens suportadas.

### Árvore de execução

- Visualizar atividades (**nós**) em árvore.
- Criar **atividades filhas** a partir de qualquer atividade.
- Manter **hierarquia infinita** e relacionamento pai–filho íntegro.
- Atribuir e visualizar responsáveis (pessoa, IA, prestador, máquina).
- Com responsável **máquina**, tratar a atividade como linguagem de programação.

### Explorar

- Persistir **toda** unidade como **arquivo**.
- Disponibilizar **explorador em lista**.
- Permitir **navegação por profundidade** na hierarquia infinita.
- Expor a mesma unidade independentemente da visão de origem.

## Regras transversais

- Hierarquia infinita não admite **ciclos** (aninhamento ou dependência).
- Coluna que **não** é de execução **não** dispara execução automática por si só.
- Card com responsável **que não é IA**, ao entrar em coluna de execução, **não** dispara execução por IA.
- Chamado válido exige descrição da **necessidade** e do **serviço desejado**.
- Exportação / compilação FOP só produz artefato útil a partir de plano modelado de forma consistente com estado e procedimentos.

## Aberto (a fechar no negócio antes do DoR)

Itens ainda sem regra fechada neste documento — histórias podem listá-los em **Notas**, mas não inventar comportamento:

- Campos mínimos de card, tarefa, atividade e chamado
- Política ao remover coluna/raia que contém cards
- Critério de conclusão / falha / retry da execução por IA
- Aceite do usuário final ao fechar chamado; transferência entre prestadores
- Modelo de datas no Gantt; roll-up de pai a partir de filhos
- Formato do código exportado e lista de linguagens de destino
- Fonte cadastral de pessoas, IAs, prestadores e máquinas

## Documentação derivada

| Camada | Onde |
|--------|------|
| Épicos | [`docs/epics.md`](docs/epics.md) |
| Histórias | [`docs/stories/`](docs/stories/) |
| Técnico | [`docs/tech/`](docs/tech/) |
