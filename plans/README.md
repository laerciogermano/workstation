# Plans

Documento de **negócio** do produto — fonte do *quê* e das regras.  
Derivados: [`docs/`](docs/) (`epics` → `stories` → `tech`). Esteira: [`docs/README.md`](docs/README.md).

---

## Problema

Ferramentas de gestão impõem hierarquias rígidas e fragmentam a mesma atividade conforme a tela. É preciso manter norte entre planejar, executar e explorar — e desenvolver de forma **redundante em múltiplas linguagens** a partir de uma **estrutura unificada** (linguagem visual → compilação → exportação).

## Objetivo

Organizar, acompanhar e visualizar o trabalho do projeto em **Board**, **Gantt**, **Árvore de execução** e **Explorar**, com responsáveis tipados (pessoa, IA, prestador, máquina) e planos tratáveis como linguagem de programação exportável (FOP).

## Princípios

1. **Uma unidade** — mesma entidade em todas as visões; só muda o nome.
2. **Hierarquia infinita** — aninhamento sem limite de profundidade, sem ciclos.
3. **Responsável tipado** — o tipo define o comportamento permitido.
4. **FOP no Gantt** — **estado** (entradas/saídas) + **procedimentos** (funções/tarefas).
5. **Linguagem visual unificada** — compilação única e exportação para outras linguagens.

## Modelo

### Unidade de trabalho

| Visão | Nome |
|-------|------|
| Board | **card** |
| Gantt | **tarefa** (**ordem**) |
| Árvore de execução | **atividade** (**nó**) |
| Explorar | **arquivo** |

Alteração em uma visão reflete nas demais. Toda unidade persiste como **arquivo** no Explorar.

### Responsáveis

Um responsável por unidade:

| Tipo | Comportamento |
|------|----------------|
| **Pessoa** | Execução humana |
| **IA** | Execução automática ao entrar em **coluna de execução** no board; execução de planos no Gantt |
| **Prestador de serviço** | Assume, executa e atende **chamado** (necessidade + serviço) do usuário final |
| **Máquina** | Unidade como **linguagem de programação** (no Gantt: bibliotecas, loops, estados) |

### Glossário

| Termo | Significado |
|-------|-------------|
| **Coluna / raia** | Estágio e faixa do board (quantidade livre) |
| **Coluna de execução** | Dispara IA ao receber card com responsável IA |
| **Chamado** | Card com necessidade e serviço desejado |
| **Entrada / saída** | Artefatos de estado de uma tarefa (FOP) |
| **Plano** | Conjunto de tarefas no Gantt para execução |

## Capacidades

### Board

Configurar colunas e raias; cadastrar, atribuir, mover e aninhar cards; marcar colunas de execução; orquestrar chamados com prestadores.

### Gantt

Visualizar ordens no tempo com entradas/saídas e responsáveis; sequencial e paralelo; aninhar; criar planos e executar via AIs; FOP; com máquina, programar e **exportar como código**; compilar/exportar na linguagem visual unificada.

### Árvore de execução

Visualizar nós; criar filhas a partir de qualquer atividade; atribuir e ver responsáveis.

### Explorar

Lista de arquivos com navegação por profundidade na hierarquia.

## Regras

- Só **coluna de execução** + responsável **IA** dispara execução automática no board.
- Chamado válido exige **necessidade** e **serviço desejado**.
- Exportação/compilação FOP exige plano consistente (estado + procedimentos).

## Aberto

Lacunas de negócio ainda sem regra. Histórias podem registrá-las em **Notas**, mas **não inventar** comportamento até fechar aqui. Cada item indica *o que falta* e *por que importa*.

### Identidade e ciclo de vida da unidade

| Falta | Por quê |
|-------|---------|
| Id canônico da unidade entre visões | Sem isso, “mesma entidade” no board/Gantt/árvore/Explorar fica ambíguo |
| Regras de exclusão, arquivamento e merge | Evitar unidade “fantasma” em uma visão e viva em outra |
| Campos mínimos comuns (ex.: título) vs. específicos por visão | Critérios de cadastro/rejeição nas US |

### Responsáveis e cadastros

| Falta | Por quê |
|-------|---------|
| Fonte de pessoas, IAs, prestadores e máquinas (conta, time, catálogo) | Sem cadastro válido, atribuição e rejeição não têm critério |
| O que é “executar o trabalho” para IA (escopo, artefatos, conclusão) | Board (coluna de execução) e Gantt (planos) dependem disso |
| Sucesso, falha, retry e estado visível após falha da IA | Orquestração automática sem definição de término |
| Herança de responsável pai→filho (sim/não) | Árvore e aninhamento no board/Gantt |
| Confirmado neste doc: **um** responsável por unidade | Manter; só revisitar se o negócio pedir múltiplos |

### Board

| Falta | Por quê |
|-------|---------|
| Política ao remover coluna/raia com cards (bloquear vs. exigir destino) | Configuração do quadro sem regra destrutiva |
| Comportamento ao mover card pai com filhos | Hierarquia infinita no fluxo |
| Restrições de transição (WIP, permissões, caminhos válidos) | Mover card além do “qualquer coluna/raia” |
| Campos obrigatórios do **chamado**; quem vê o chamado | Mercado prestador |
| Definição de “atendido”; aceite do usuário final; transferência entre prestadores | Fechamento do chamado |

### Gantt e FOP

| Falta | Por quê |
|-------|---------|
| Diferença operacional entre **plano** e “conjunto de tarefas” | Criar/executar planos |
| Modelo temporal (início, fim, duração, fuso); tarefa sem data | Posicionamento no eixo |
| Semântica sequencial (finish-to-start vs. só ordem visual) | Dependências |
| Conflito paralelo × sequencial (rejeitar vs. sobrescrever) | Modelagem consistente |
| Roll-up de datas/estado do pai a partir dos filhos | Hierarquia no tempo |
| Tipo/formato dos artefatos de **entrada/saída**; obrigatoriedade de ligar saídas | FOP validável |
| Catálogo de bibliotecas e sintaxe de loops (responsável máquina) | Linguagem no Gantt |
| Formato do código exportado; linguagens de destino suportadas | Exportação e linguagem visual unificada |
| Orquestração parcial (só tarefas com IA) e cancelamento de execução | Executar planos via AIs |

### Árvore de execução

| Falta | Por quê |
|-------|---------|
| Raiz única vs. múltiplas raízes | Forma da árvore vazia/inicial |
| Paridade máquina com o Gantt (bibliotecas/loops na árvore ou só “procedimento”) | Responsável máquina na árvore |
| Campos mínimos da atividade | Criar filhas |

### Explorar

| Falta | Por quê |
|-------|---------|
| Ordenação, filtros e busca na lista | Navegação além de “existe lista” |
| Forma da navegação por profundidade (drill-down, caminho, etc.) | Pode ficar em UI; a regra de negócio já exige percorrer a hierarquia |

### Como fechar

1. Decidir cada linha acima neste README (regra explícita ou “fora de escopo v1”).
2. Atualizar histórias afetadas (aceite + remover Nota correspondente).
3. Só então marcar a US como `ready` (DoR).
