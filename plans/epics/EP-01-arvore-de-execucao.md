# EP-01 — Árvore de execução

**Intenção:** árvore com todas as atividades pais e filhas.

## Objetivo

Exibir a hierarquia completa de execução — todas as atividades pais e filhas — numa árvore navegável.

## Personas

Todas consultam; criar, remover e atribuir: Condutor.

## Telas no protótipo

T-40, T-41.

## Funcionalidades

| ID | Funcionalidade | O que faz |
|----|----------------|-----------|
| F01 | Criar nó | Cria uma atividade raiz (pelo **+** do nó **root**) ou filha direto no nó, com título obrigatório |
| F02 | Remover nó | Remove o nó e a subárvore, com confirmação quando houver filhos |
| F03 | Atribuir responsável | Define, troca ou tira o responsável do nó |
| F04 | Atribuir descrição | Escreve a descrição do nó em Markdown, com leitura formatada, edição, modo dividido e tela cheia; é opcional |
| F05 | Zoom e pan | Aproxima e afasta a árvore, ajusta à tela e move arrastando o fundo |
| F06 | Minimizar ramos | Esconde e mostra os filhos de um nó ou de todos de uma vez, com a contagem do que está oculto |
| F07 | Renomear nó | Dois cliques no título (ou F2) editam o nome no próprio cartão |
| F08 | Mover e reordenar | Arrastar e soltar um nó para mudar a posição entre irmãos, torná-lo filho de outro ou levá-lo a raiz, sem ciclos |
| F09 | Definir status | Marca o nó como To do, Doing ou Done, pelo painel ou clicando no cartão |

## Fora deste épico

Dividir em partes.
