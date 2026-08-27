# Histórias de usuário — Plans

Histórias derivadas do [documento de visão](../README.md) e dos fundamentos FOP em [`../inputs/`](../inputs/):

- `Programação Orientada a Fluxo.docx` / `.pdf`
- `Livro Flow Oriented Programming.docx`
- `Meditações flow.docx`

Apenas a descrição no formato **Como… quero… para…**. Cenários BDD: [`bdd.md`](bdd.md). Telas: [`screens.md`](screens.md). Componentes: [`components.md`](components.md). Protótipo: [`prototype.html`](prototype.html).

## Personas

| Persona | Papel | Histórias |
|---------|-------|-----------|
| **Organizador** | Registra intenções no board, acompanha progresso e opera a árvore do Explorar (criar, abrir, renomear, mover, buscar). | US-01, US-05, US-17, US-18, US-20, US-21, US-22, US-23, US-24, US-25, US-26, US-27, US-28, US-29, US-30, US-31, US-32, US-33 |
| **Condutor de projetos** | Configura o board, planeja ordens no Gantt, decompõe hierarquias e acompanha a mesma unidade em board, tempo, árvore e arquivos. | US-01, US-04, US-05, US-06, US-08, US-09, US-10, US-15, US-16, US-17, US-18, US-19, US-20, US-21, US-22, US-23, US-24, US-25 |
| **Orquestrador** | Atribui responsáveis tipados e dispara execução de IAs no board e no Gantt. | US-02, US-07, US-11 |
| **Modelador de fluxo** | Modela roteiros FOP no Gantt, programa tarefas máquina, compila FOP-IR e exporta TypeScript ou Python. | US-08, US-09, US-10, US-12, US-13, US-14, US-19 |
| **Administrador do projeto** | Mantém o catálogo de pessoas, IAs e máquinas atribuíveis no projeto. | US-03 |

---

## US-01 — Mesma unidade, vocabulário e ciclo de vida

Como **organizador**, quero **que toda atividade tenha um id canônico (UUID) estável, apareça com o nome certo em cada visão (card no Board, tarefa no Gantt, atividade/nó na Árvore, arquivo no Explorar) e possa ser excluída, arquivada ou desarquivada**, para que **a mesma intenção permaneça reconhecível em qualquer superfície sem perder identidade nem histórico**.

## US-02 — Atribuir responsável tipado

Como **orquestrador**, quero **atribuir, trocar ou remover um responsável (pessoa, IA ou máquina) a partir do catálogo do projeto, sem herança automática do pai para o filho**, para que **o ator do roteiro fique definido sem redesenhar o fluxo quando eu trocar quem executa**.

## US-03 — Gerenciar catálogo de responsáveis

Como **administrador do projeto**, quero **incluir e remover pessoas, IAs e máquinas no catálogo do projeto**, para que **somente atores autorizados possam ser atribuídos como responsáveis**.

## US-04 — Configurar colunas e raias

Como **condutor de projetos**, quero **configurar colunas e raias (swimlanes) em quantidade livre, reordená-las e removê-las somente quando estiverem vazias**, para que **o board reflita o processo do time sem perder cards por remoção indevida**.

## US-05 — Cadastrar e mover cards

Como **organizador**, quero **cadastrar cards no board com título obrigatório e contexto opcional (orçamento, preferências, restrições) e movê-los entre qualquer coluna e raia válida**, para que **todas as intenções nasçam e sejam acompanhadas no board, sem restrições de WIP ou caminho em v1**.

## US-06 — Aninhar e mover hierarquia de cards

Como **condutor de projetos**, quero **aninhar cards em hierarquia infinita, desaninhar e mover o pai junto com toda a subárvore**, para que **eu decomponha intenções complexas e reposicione blocos inteiros de trabalho de uma vez**.

## US-07 — Colunas de execução e orquestração de IA

Como **orquestrador**, quero **marcar colunas como de execução e, ao mover para elas um card com responsável IA, disparar a execução com estados `pendente` → `em execução` → `concluída` / `falhou` / `cancelada`, com retry apenas por ação explícita**, para que **IAs trabalhem automaticamente só onde couber, com critério claro de término e falha visível**.

## US-08 — Planos, ordens e datas

Como **condutor de projetos**, quero **criar planos nomeados, associar tarefas a um plano (ou ao plano padrão do projeto) e definir datas de início e fim no fuso do projeto**, para que **as ordens fiquem organizadas no tempo, com duração derivada e tarefas sem data sinalizadas na lista do Gantt**.

## US-09 — Tarefas sequenciais e paralelas

Como **modelador de fluxo**, quero **definir relações sequenciais (finish-to-start) e paralelas entre tarefas, removê-las e impedir conflito entre os dois modos**, para que **o roteiro temporal reflita dependências reais sem ciclos nem combinações inválidas**.

## US-10 — Aninhar tarefas e roll-up

Como **condutor de projetos**, quero **aninhar tarefas em hierarquia infinita no Gantt e ver roll-up de datas e estado no pai (min início, max fim; falha se algum filho falhou)**, para que **subplanos agreguem progresso e prazo sem herança de responsável**.

## US-11 — Execução de planos via AIs

Como **orquestrador**, quero **executar um plano apenas nas tarefas com responsável IA, cancelar a execução em andamento e retentar tarefas `falhou` ou `cancelada` por ação explícita**, para que **a orquestração automática seja parcial, controlável e transparente sobre o que está rodando**.

## US-12 — Flow Oriented Programming

Como **modelador de fluxo**, quero **definir entradas e saídas de estado (nome + referência), ligar saídas a entradas, compor procedimentos como funções/tarefas e validar o plano (aviso para saídas órfãs; bloqueio para ciclo de estado)**, para que **o Gantt expresse um roteiro FOP completo — dados + funções — pronto para compilação**.

## US-13 — Máquina como linguagem no Gantt

Como **modelador de fluxo**, quero **programar e executar tarefas com responsável máquina usando bibliotecas v1 (`stdio`, `fs`, `http`), loops (`for`, `while`) e estados de entrada/saída**, para que **o Gantt funcione também como linguagem de programação orientada a fluxo, não só como cronograma**.

## US-14 — Exportar código e linguagem visual unificada

Como **modelador de fluxo**, quero **compilar um plano consistente em FOP-IR e exportar para TypeScript ou Python (direto ou via IR), com aviso para saídas órfãs e rejeição de destinos não suportados em v1**, para que **o mesmo roteiro visual vire código reutilizável sem reescrever o fluxo em cada linguagem**.

## US-15 — Visualizar árvore e responsáveis

Como **condutor de projetos**, quero **ver a floresta de atividades (múltiplas raízes) com responsáveis visíveis e, quando o responsável for máquina, editar o procedimento associado ao nó**, para que **eu entenda a execução hierárquica fora do eixo temporal do Gantt**.

## US-16 — Criar atividades e hierarquia infinita

Como **condutor de projetos**, quero **criar atividades raiz e filhas com título, desaninhar, reorganizar pais e excluir subárvores**, para que **a decomposição da execução não tenha limite de profundidade e permaneça livre de ciclos**.

## US-17 — Persistir e abrir no Explorar

Como **organizador**, quero **que toda unidade persista como arquivo no Explorar e possa ser aberta a partir do Board, Gantt ou Árvore (e vice-versa)**, para que **a mesma entidade seja navegável como arquivo sem duplicar dados**.

## US-18 — Lista em árvore e drill-down infinito

Como **organizador**, quero **ver os arquivos numa lista em árvore (componente do painel Explorar, estilo IDE) ordenada por título e expandir níveis sem limite de profundidade**, para que **eu percorra a hierarquia persistida de forma previsível, mesmo com aninhamento infinito**.

## US-19 — Seleção, repetição, camadas e contexto

Como **modelador de fluxo**, quero **compor estruturas de seleção (condicionais) e repetição no roteiro do plano, organizar endereços em camadas substituíveis e garantir que a execução só ocorra com contexto completo**, para que **fluxos condicionais, iterativos e desacoplados (roteiro × ator) sejam modelados no Gantt Flow sem acoplar regras de negócio a hardware ou linguagem de destino**.

---

## Explorar — operações na árvore (estilo IDE)

Histórias do painel Explorar alinhadas a exploradores de IDE (ex.: VS Code). Complementam US-17 (persistir / abrir entre visões) e US-18 (lista em árvore e drill-down).

## US-20 — Adicionar nó na árvore do Explorar

Como **organizador**, quero **adicionar um novo nó (arquivo) na árvore do Explorar — como raiz ou filho do nó selecionado — informando o título**, para que **eu materialize intenções direto na hierarquia de arquivos, no mesmo padrão de “New File” de um explorador de IDE**.

## US-21 — Remover nó do arquivo no Explorar

Como **organizador**, quero **remover o nó do arquivo criado (e a subárvore, se houver) a partir do Explorar, com confirmação quando houver filhos**, para que **eu limpe a hierarquia pelo próprio painel sem precisar ir ao Board ou à Árvore**.

## US-22 — Visualizar arquivo criado no Explorar

Como **organizador**, quero **selecionar e visualizar o arquivo criado no Explorar (destacar na árvore e abrir a unidade na visão pedida: Board, Gantt ou Árvore)**, para que **eu confirme o que foi criado e continue o trabalho na superfície adequada, sem detalhe de arquivo no próprio painel**.

## US-23 — Renomear nó do arquivo no Explorar

Como **organizador**, quero **renomear o nó do arquivo criado inline na árvore do Explorar (F2 / ação de contexto), com o novo título refletido em todas as visões**, para que **eu ajuste o nome sem abrir o detalhe e mantenha a identidade (UUID) estável**.

## US-24 — Criar pasta / container na árvore

Como **organizador**, quero **criar um nó container (pasta lógica) na árvore do Explorar para agrupar arquivos filhos**, para que **eu organize a hierarquia como em um explorador de pastas de IDE, sem misturar criação de arquivo e de agrupador**.

## US-25 — Mover nó por arrastar e soltar

Como **organizador**, quero **arrastar e soltar nós na árvore do Explorar para mudar o pai ou a posição entre irmãos, bloqueando movimentos que criem ciclo**, para que **eu reestruture a hierarquia de arquivos com o mesmo gesto de um explorador de IDE**.

## US-26 — Recortar, copiar e colar nós

Como **organizador**, quero **recortar, copiar e colar nós (e subárvores) na árvore do Explorar**, para que **eu reorganize ou replique estruturas de arquivos sem recriar cada nó manualmente**.

## US-27 — Duplicar nó

Como **organizador**, quero **duplicar um nó (e opcionalmente a subárvore) no Explorar, gerando novos UUIDs e um título distinto**, para que **eu parta de um modelo existente sem alterar o original**.

## US-28 — Buscar e filtrar na árvore do Explorar

Como **organizador**, quero **buscar e filtrar nós pelo título na árvore do Explorar, expandindo automaticamente o caminho até os resultados**, para que **eu encontre arquivos em hierarquias profundas sem scroll manual**.

## US-29 — Expandir, recolher e colapsar irmãos

Como **organizador**, quero **expandir tudo, recolher tudo e colapsar pastas irmãs a partir de um nó (como “Collapse Others” / “Collapse All”)**, para que **eu controle o ruído visual da árvore em projetos grandes**.

## US-30 — Menu de contexto e atalhos de teclado

Como **organizador**, quero **ações do Explorar via menu de contexto e atalhos (criar, renomear, excluir, copiar, colar, abrir em…), no padrão de exploradores de IDE**, para que **eu opere a árvore com velocidade e sem depender só da barra de ferramentas**.

## US-31 — Seleção múltipla de nós

Como **organizador**, quero **selecionar vários nós na árvore (clique + modificadores) e aplicar exclusão, movimentação ou cópia em lote**, para que **eu trate grupos de arquivos de uma vez, como no explorador do VS Code**.

## US-32 — Copiar caminho e revelar na árvore

Como **organizador**, quero **copiar o caminho lógico do nó e revelar/destacar um arquivo já conhecido na árvore do Explorar**, para que **eu compartilhe referências e localize rapidamente a unidade no painel**.

## US-33 — Reordenar irmãos e persistir estado da árvore

Como **organizador**, quero **reordenar nós irmãos na árvore e ter o estado de expansão/recolhimento persistido entre sessões**, para que **a árvore volte como eu a deixei e a ordem entre pares reflita a organização desejada**.

## Próximos passos

→ [`bdd.md`](bdd.md)
