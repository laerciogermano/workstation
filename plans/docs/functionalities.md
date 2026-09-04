# Funcionalidades do sistema — Plans

**Por quê:** reunir, em bullets, as capacidades esperadas em cada seção e página do sistema.  
**Papel no fluxo:** servir como base funcional para a escrita das histórias de usuário, sem antecipar critérios de aceite, layout ou implementação.  
**Origem:** documento de [visão](../README.md), regras de negócio e fundamentos FOP em [`../inputs/`](../inputs/).

## Como usar este documento

- Cada bullet descreve uma capacidade observável do produto.
- Uma funcionalidade pode originar uma ou mais histórias de usuário.
- As histórias devem preservar as regras transversais e os limites de v1 descritos na visão.
- Critérios de aceite ficam no [`bdd.md`](bdd.md).
- Superfícies, navegação e ações de UI são detalhadas no [`screens.md`](screens.md).

---

## Funcionalidades transversais

### Identidade e ciclo de vida

- Manter uma unidade de trabalho com UUID canônico e estável.
- Representar a mesma unidade como card no Board, tarefa/ordem no Gantt, atividade/nó na Árvore e arquivo no Explorar.
- Refletir alterações de título, contexto, responsável e hierarquia em todas as visões.
- Excluir uma unidade globalmente, removendo-a de todas as visões.
- Arquivar uma unidade sem excluí-la do Explorar.
- Desarquivar uma unidade e devolvê-la ao fluxo ativo.
- Exigir título para criar uma unidade.
- Permitir contexto opcional para orientar a execução humana ou por IA.
- Impedir ciclos na hierarquia.

### Navegação entre visões

- Exibir o menu de visões fixo no topo e centralizado na área de conteúdo.
- Navegar entre Board, Gantt e Árvore de execução mantendo o contexto do projeto.
- Abrir uma unidade diretamente na visão escolhida.
- Preservar o UUID ao trocar a unidade de uma visão para outra.
- Abrir ou revelar a unidade no Explorar sem criar uma cópia.

### Detalhe da unidade

- Abrir um drawer ou painel transversal a partir do Board, Gantt e Árvore.
- Exibir UUID, título e o vocabulário correspondente à visão de origem.
- Editar título e contexto.
- Atribuir, trocar ou remover responsável.
- Exibir artefatos ou saídas ligados à unidade.
- Exibir o estado do ciclo de vida.
- Executar excluir, arquivar, desarquivar e abrir em outra visão.
- Não oferecer merge de unidades em v1.

---

## Seção Explorar

### Painel Explorar

- Manter o painel Explorar visível como explorador de arquivos de IDE.
- Materializar toda atividade como um arquivo na árvore.
- Exibir arquivos ativos e permitir acesso aos arquivados.
- Usar uma lista em árvore embutida no painel, sem transformá-la em uma tela independente.
- Expandir e recolher níveis sem limite de profundidade.
- Ordenar os nós por título em cada nível.
- Manter o painel fixo com altura da viewport.
- Permitir overflow vertical e horizontal na área da árvore.
- Manter o título legível mesmo em hierarquias muito profundas.
- Destacar e revelar uma unidade conhecida na árvore.
- Abrir a unidade no Board, Gantt ou Árvore.
- Não exibir detalhe de arquivo dentro do painel Explorar.

### Operações na árvore

- Criar um arquivo como nó raiz ou filho do nó selecionado.
- Criar uma pasta ou container lógico para agrupar arquivos.
- Renomear um nó inline, preservando seu UUID.
- Excluir um nó e sua subárvore, solicitando confirmação quando houver filhos.
- Mover nós por arrastar e soltar.
- Mudar o pai ou a posição entre irmãos.
- Bloquear movimentos que criariam ciclos.
- Recortar, copiar e colar nós e subárvores.
- Duplicar um nó com novos UUIDs e título distinto.
- Escolher se a duplicação inclui a subárvore.
- Buscar e filtrar nós pelo título.
- Expandir automaticamente o caminho até resultados de busca.
- Expandir tudo e recolher tudo.
- Colapsar pastas irmãs a partir de um nó.
- Operar por menu de contexto.
- Operar por atalhos de teclado.
- Selecionar múltiplos nós com modificadores.
- Excluir, mover ou copiar vários nós em lote.
- Copiar o caminho lógico de um nó.
- Reordenar nós irmãos.
- Persistir o estado de expansão e recolhimento entre sessões.

---

## Página Board

### Organização do fluxo

- Exibir cards organizados por colunas e raias.
- Criar card com título obrigatório.
- Associar contexto opcional ao card.
- Exibir responsável tipado no card.
- Exibir estado de execução de IA quando aplicável.
- Mover cards entre qualquer coluna e raia válida.
- Permitir qualquer caminho entre colunas em v1, sem WIP limit.
- Aninhar cards em hierarquia sem limite de profundidade.
- Desaninhar cards.
- Mover um pai junto com toda a sua subárvore.
- Indicar visualmente relações de pai e filho.
- Abrir o detalhe da unidade.
- Abrir a unidade no Gantt, na Árvore ou no Explorar.

### Configuração do Board

- Adicionar colunas.
- Renomear colunas.
- Reordenar colunas.
- Remover colunas somente quando estiverem vazias.
- Adicionar raias.
- Renomear raias.
- Reordenar raias.
- Remover raias somente quando estiverem vazias.
- Marcar e desmarcar uma coluna como coluna de execução.
- Avisar quando uma remoção estiver bloqueada por cards existentes.

### Execução de IA no Board

- Disparar execução somente quando um card com responsável IA entrar em coluna de execução.
- Exibir os estados `pendente`, `em execução`, `concluída`, `falhou` e `cancelada`.
- Permitir cancelar uma execução em andamento.
- Permitir retry somente por ação explícita.
- Exibir falha e estado de execução no card.

---

## Página Detalhe da unidade

- Exibir a identidade canônica da unidade.
- Exibir título e contexto.
- Editar título.
- Editar contexto.
- Selecionar pessoa, IA ou máquina do catálogo do projeto.
- Trocar ou remover o responsável.
- Não herdar automaticamente o responsável do pai.
- Exibir entradas, saídas e artefatos vinculados quando existirem.
- Arquivar e desarquivar a unidade.
- Excluir a unidade globalmente.
- Abrir a unidade em Board, Gantt, Árvore ou Explorar.

---

## Página Plano / Gantt

### Planos e cronograma

- Criar planos nomeados.
- Renomear planos.
- Excluir planos, preservando as tarefas do plano padrão quando aplicável.
- Selecionar o plano exibido.
- Associar uma tarefa a um plano.
- Usar o plano padrão do projeto quando nenhum plano for informado.
- Criar tarefa com título obrigatório.
- Definir data de início e data de fim no fuso do projeto.
- Derivar a duração a partir das datas.
- Rejeitar datas em que o início seja posterior ao fim.
- Listar e sinalizar tarefas sem datas válidas.
- Posicionar tarefas datadas no eixo temporal.

### Relações e hierarquia

- Definir relações sequenciais entre tarefas.
- Interpretar relação sequencial como finish-to-start.
- Definir relações paralelas entre tarefas.
- Remover ou ajustar relações existentes.
- Rejeitar combinação conflitante entre relação paralela e dependência sequencial.
- Impedir ciclos no fluxo de tarefas.
- Aninhar tarefas em hierarquia sem limite de profundidade.
- Desaninhar tarefas.
- Calcular roll-up do pai usando o menor início e o maior fim dos filhos datados.
- Agregar falha no pai quando algum filho falhar.
- Manter responsável independente da hierarquia.

### Execução via IA

- Executar um plano somente nas tarefas com responsável IA.
- Exibir estados de execução das tarefas.
- Cancelar execução em andamento.
- Retentar explicitamente tarefas `falhou` ou `cancelada`.
- Permitir que tarefas sem responsável IA permaneçam fora da execução automática.

### Modelagem FOP

- Representar dados como estados de entrada e saída.
- Criar artefatos com nome e referência.
- Definir entradas e saídas para tarefas ou procedimentos.
- Ligar saídas a entradas.
- Compor funções e tarefas em um roteiro.
- Modelar estruturas sequenciais.
- Modelar estruturas paralelas.
- Modelar estruturas de seleção.
- Modelar estruturas de repetição.
- Organizar endereços concretos e abstratos em camadas.
- Tratar camadas como unidades substituíveis.
- Validar se o contexto necessário para execução está completo.
- Avisar sobre saídas órfãs.
- Bloquear a execução e a exportação útil quando houver ciclo de estado.

### Programação de máquina

- Permitir procedimento editável quando o responsável for uma máquina.
- Programar tarefas de máquina no Gantt.
- Representar estados de entrada e saída no procedimento.
- Disponibilizar as bibliotecas v1 `stdio`, `fs` e `http`.
- Disponibilizar loops `for` e `while`.
- Exibir feedback da execução.
- Exibir o resultado da execução.
- Permitir edição parcial do procedimento na Árvore de execução.

### Compilação e exportação

- Validar a consistência do plano antes da compilação.
- Compilar um plano consistente para FOP-IR.
- Exibir o status de consistência.
- Exibir ou inspecionar o FOP-IR gerado.
- Exportar para TypeScript.
- Exportar para Python.
- Oferecer preview do código exportado.
- Permitir download do código.
- Avisar sobre saídas órfãs na exportação.
- Bloquear exportação útil quando houver ciclo de estado.
- Rejeitar destinos de exportação fora de TypeScript e Python em v1.

---

## Página Árvore de execução

### Visualização e hierarquia

- Exibir uma floresta com múltiplas raízes.
- Exibir atividades em hierarquia sem limite de profundidade.
- Exibir o responsável de cada nó.
- Criar atividade raiz com título obrigatório.
- Criar atividade filha com título obrigatório.
- Desaninhar atividades.
- Reorganizar pais e filhos.
- Impedir ciclos na reorganização.
- Excluir uma atividade e sua subárvore do fluxo ativo.
- Abrir uma atividade no Board, Gantt ou Explorar.
- Abrir o detalhe da unidade.

### Procedimento de máquina

- Identificar quando o responsável do nó é uma máquina.
- Permitir editar o procedimento da máquina no nó.
- Manter a edição completa e a execução no Gantt.
- Refletir alterações do procedimento entre a Árvore e o Gantt.

---

## Seção Configurações

### Catálogo de responsáveis

- Exibir o catálogo separado por pessoas, IAs e máquinas.
- Incluir pessoa no catálogo.
- Incluir IA no catálogo.
- Incluir máquina no catálogo.
- Listar os itens disponíveis para atribuição.
- Indicar quando um item está em uso como responsável.
- Remover item que não esteja atribuído a nenhuma unidade.
- Bloquear ou exigir limpeza antes de remover item em uso.
- Exibir as unidades que usam um item para facilitar a limpeza.
- Disponibilizar o catálogo como configuração fixa na parte inferior do Explorar.

---

## Fora do escopo em v1

- Fazer merge de unidades.
- Aplicar WIP limits.
- Restringir permissões de caminho no Board.
- Oferecer paridade total entre bibliotecas e loops da máquina na Árvore.
- Exportar para destinos além de TypeScript e Python.
