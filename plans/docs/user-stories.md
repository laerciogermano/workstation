# Histórias de usuário — Plans

Histórias derivadas do [documento de visão](../README.md) e dos fundamentos FOP em [`../inputs/`](../inputs/):

- `Programação Orientada a Fluxo.docx` / `.pdf`
- `Livro Flow Oriented Programming.docx`
- `Meditações flow.docx`

Apenas a descrição no formato **Como… quero… para…**. Cenários BDD: [`bdd.md`](bdd.md). Telas: [`screens.md`](screens.md). Componentes: [`components.md`](components.md). Protótipo: [`prototype.html`](prototype.html).

## Personas

| Persona | Papel | Histórias |
|---------|-------|-----------|
| **Organizador** | Registra intenções pessoais, acompanha progresso, pesquisa com IA, registra decisões e navega pelo Explorar. | US-01, US-05, US-18, US-19, US-20, US-21, US-22 |
| **Condutor de projetos** | Configura o board, planeja ordens no Gantt, decompõe hierarquias e acompanha a mesma unidade em board, tempo, árvore e arquivos. | US-01, US-04, US-05, US-06, US-09, US-10, US-11, US-16, US-17, US-18, US-19, US-23 |
| **Orquestrador** | Atribui responsáveis tipados, dispara execução de IAs no board e no Gantt e conduz chamados com prestadores. | US-02, US-07, US-08, US-12, US-21 |
| **Modelador de fluxo** | Modela roteiros FOP no Gantt, programa tarefas máquina, compila FOP-IR e exporta TypeScript ou Python. | US-09, US-10, US-11, US-13, US-14, US-15, US-23 |
| **Administrador do projeto** | Mantém o catálogo de pessoas, IAs, prestadores e máquinas atribuíveis no projeto. | US-03 |
| **Prestador de serviço** | Visualiza chamados abertos, assume, executa, conclui e transfere atendimentos. | US-08 |

---

## US-01 — Mesma unidade, vocabulário e ciclo de vida

Como **organizador**, quero **que toda atividade tenha um id canônico (UUID) estável, apareça com o nome certo em cada visão (card no Board, tarefa no Gantt, atividade/nó na Árvore, arquivo no Explorar) e possa ser excluída, arquivada ou desarquivada**, para que **a mesma intenção permaneça reconhecível em qualquer superfície sem perder identidade nem histórico**.

## US-02 — Atribuir responsável tipado

Como **orquestrador**, quero **atribuir, trocar ou remover um responsável (pessoa, IA, prestador ou máquina) a partir do catálogo do projeto, sem herança automática do pai para o filho**, para que **o ator do roteiro fique definido sem redesenhar o fluxo quando eu trocar quem executa**.

## US-03 — Gerenciar catálogo de responsáveis

Como **administrador do projeto**, quero **incluir e remover pessoas, IAs, prestadores e máquinas no catálogo do projeto**, para que **somente atores autorizados possam ser atribuídos como responsáveis**.

## US-04 — Configurar colunas e raias

Como **condutor de projetos**, quero **configurar colunas e raias (swimlanes) em quantidade livre, reordená-las e removê-las somente quando estiverem vazias**, para que **o board reflita o processo do time sem perder cards por remoção indevida**.

## US-05 — Cadastrar e mover cards

Como **organizador**, quero **cadastrar cards com título obrigatório e movê-los entre qualquer coluna e raia válida**, para que **eu registre e acompanhe o fluxo de trabalho no board sem restrições de WIP ou caminho em v1**.

## US-06 — Aninhar e mover hierarquia de cards

Como **condutor de projetos**, quero **aninhar cards em hierarquia infinita, desaninhar e mover o pai junto com toda a subárvore**, para que **eu decomponha intenções complexas e reposicione blocos inteiros de trabalho de uma vez**.

## US-07 — Colunas de execução e orquestração de IA

Como **orquestrador**, quero **marcar colunas como de execução e, ao mover para elas um card com responsável IA, disparar a execução com estados `pendente` → `em execução` → `concluída` / `falhou` / `cancelada`, com retry apenas por ação explícita**, para que **IAs trabalhem automaticamente só onde couber, com critério claro de término e falha visível**.

## US-08 — Chamado e prestador de serviço

Como **organizador**, quero **abrir chamados com título, necessidade e serviço desejado visíveis a todos os prestadores do catálogo**; e como **prestador de serviço**, quero **assumir, executar, concluir e transferir chamados, com aceite ou rejeição do usuário final**, para que **serviços externos sejam orquestrados com fechamento explícito (`aguardando aceite` → `atendido`)**.

## US-09 — Planos, ordens e datas

Como **condutor de projetos**, quero **criar planos nomeados, associar tarefas a um plano (ou ao plano padrão do projeto) e definir datas de início e fim no fuso do projeto**, para que **as ordens fiquem organizadas no tempo, com duração derivada e tarefas sem data sinalizadas na lista do Gantt**.

## US-10 — Tarefas sequenciais e paralelas

Como **modelador de fluxo**, quero **definir relações sequenciais (finish-to-start) e paralelas entre tarefas, removê-las e impedir conflito entre os dois modos**, para que **o roteiro temporal reflita dependências reais sem ciclos nem combinações inválidas**.

## US-11 — Aninhar tarefas e roll-up

Como **condutor de projetos**, quero **aninhar tarefas em hierarquia infinita no Gantt e ver roll-up de datas e estado no pai (min início, max fim; falha se algum filho falhou)**, para que **subplanos agreguem progresso e prazo sem herança de responsável**.

## US-12 — Execução de planos via AIs

Como **orquestrador**, quero **executar um plano apenas nas tarefas com responsável IA, cancelar a execução em andamento e retentar tarefas `falhou` ou `cancelada` por ação explícita**, para que **a orquestração automática seja parcial, controlável e transparente sobre o que está rodando**.

## US-13 — Flow Oriented Programming

Como **modelador de fluxo**, quero **definir entradas e saídas de estado (nome + referência), ligar saídas a entradas, compor procedimentos como funções/tarefas e validar o plano (aviso para saídas órfãs; bloqueio para ciclo de estado)**, para que **o Gantt expresse um roteiro FOP completo — dados + funções — pronto para compilação**.

## US-14 — Máquina como linguagem no Gantt

Como **modelador de fluxo**, quero **programar e executar tarefas com responsável máquina usando bibliotecas v1 (`stdio`, `fs`, `http`), loops (`for`, `while`) e estados de entrada/saída**, para que **o Gantt funcione também como linguagem de programação orientada a fluxo, não só como cronograma**.

## US-15 — Exportar código e linguagem visual unificada

Como **modelador de fluxo**, quero **compilar um plano consistente em FOP-IR e exportar para TypeScript ou Python (direto ou via IR), com aviso para saídas órfãs e rejeição de destinos não suportados em v1**, para que **o mesmo roteiro visual vire código reutilizável sem reescrever o fluxo em cada linguagem**.

## US-16 — Visualizar árvore e responsáveis

Como **condutor de projetos**, quero **ver a floresta de atividades (múltiplas raízes) com responsáveis visíveis e, quando o responsável for máquina, editar o procedimento associado ao nó**, para que **eu entenda a execução hierárquica fora do eixo temporal do Gantt**.

## US-17 — Criar atividades e hierarquia infinita

Como **condutor de projetos**, quero **criar atividades raiz e filhas com título, desaninhar, reorganizar pais e excluir subárvores**, para que **a decomposição da execução não tenha limite de profundidade e permaneça livre de ciclos**.

## US-18 — Persistir e abrir no Explorar

Como **organizador**, quero **que toda unidade persista como arquivo no Explorar e possa ser aberta a partir do Board, Gantt ou Árvore (e vice-versa)**, para que **a mesma entidade seja navegável como arquivo sem duplicar dados**.

## US-19 — Lista, busca e navegação por profundidade

Como **organizador**, quero **listar arquivos ordenados por título, buscar por título e navegar em profundidade com drill-down e breadcrumb**, para que **eu percorra a hierarquia persistida de forma previsível, mesmo com aninhamento infinito**.

## US-20 — Registrar atividade com objetivo e contexto

Como **organizador**, quero **registrar uma atividade com título obrigatório e contexto opcional (orçamento, preferências, restrições)**, para que **a intenção fique capturada e oriente minha execução ou a de uma IA atribuída**.

## US-21 — Pesquisar opções com IA

Como **organizador**, quero **solicitar pesquisa assistida por IA a partir de uma atividade com responsável IA, usando título e contexto, e receber comparativo estruturado (opções, benefícios, faixas de preço) como saída ligada à mesma unidade**, para que **eu decida com base em evidências sem sair do Plans**.

## US-22 — Registrar decisão na atividade

Como **organizador**, quero **registrar a opção escolhida em uma atividade (com observação opcional), alterá-la antes de concluir e manter decisão e comparativo acessíveis após arquivar**, para que **a etapa de decisão fique documentada e eu saiba o que foi definido**.

## US-23 — Seleção, repetição, camadas e contexto

Como **modelador de fluxo**, quero **compor estruturas de seleção (condicionais) e repetição no roteiro do plano, organizar endereços em camadas substituíveis e garantir que a execução só ocorra com contexto completo**, para que **fluxos condicionais, iterativos e desacoplados (roteiro × ator) sejam modelados no Gantt Flow sem acoplar regras de negócio a hardware ou linguagem de destino**.
