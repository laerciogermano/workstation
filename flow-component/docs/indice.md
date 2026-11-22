- Flow
  - linguagem de programacao visual
  - Linguagem universal -> transpila para quaquer linguagem
  - Gerenciador de tarefas
  - Possui as features das linguagens de programacao
  - torna codigo em visao, aumentando facilidade de analise
  - visao logistica de todos os fluxos
  - similar a u m n8n, orquestrador de processos
  - components substituiveis em qualquer contexto, desacoplamento a nivel de
  - visulizar imagem é mais facil do que visualizar texto, uma imagem fala mais que mil palavras
  - os conceitos sao confusos vendo apenas texto, ;e como jogar xadrez sem ver o tabuleiro, apenas com posicoes de texto
  - é necessario de muito esforco cognitivo par entender codigo
  - ate o prosente momento mnao existia uma forma de enxergar software tao fidedigna, é dar face ao que antes n foi visto, com todos os recursos de programacao
  servico.
- atualmente, existem diferentes linguagens, diferentes paradigmas, todas com suas nuances, suas formas de se fazer a mesma coisa, o flow é a visualiacaounica, a linguagem ubiqua, o codigo universal.
- flow nao se trata apenas de uma forma unificada de ver software, mas tambem de ver a propria realidade
- tudo é composto por funcoes (eternos) e estados (mutáveis)
  - softwares sao feitos de fluxos de esxecucao
  - resumidamente, um fluxo de exduccao é formado por dados e funcoes
- 1. Funcoes
  - 1.1 [`main`](indice-ast.html#main) — 1ª ordem, sólida, sem entrada nem saída (JS + AST + plano SVG)
  - 1.2 [`função filha`](indice-ast.html#filha) — filho dentro de main (composição)
  - 1.3 [`função paralela`](indice-ast.html#paralela) — irmã no mesmo passo (par / Promise.all)
  - 1.4 [`função sequencial`](indice-ast.html#sequencial) — irmã no passo seguinte (await em sequência)
  - funcoes sao unidades de transformacao
  - toda funcao de primeiro grau é sólida e pertence ao arquivo de origem como responsavel
  - uma funcao pode ter funcao filhas
  - uma funcao pode ter funcoes irmas
  - as funcoes podem ser sequenciais
  - as funcoes podem ser paralelas
  - podem possuir entrada e saida
  - apenas podem ter uma entrada e uma saida
  - a entrada e saida sao dados
- Dados
  - os dados sao unidades transformaveis
    input
  - output
  - podem ser
    - texto
    - numero
    - boleano
    - funcoes
    - objetos (caixas)
      - seres que possuem dados e funcao,
      - array
        - posicionais []
      - obj
        - chaveados {}
      - arquivo (futuramente)
      - imagem (futuramente)
- Estados
  - estados sao os dados que estao disponiveis
  - os estados iniciais sempre serao 
- Agentes
  - Estruturas fonte da execucao
  - responsavrl por realizar o trabalho
  - a fonte, a origem da execucao
  - fonte do trabalho
  - podem ser arquivos, pessoas, ias, agentes como um todo
  - toda estrutuar que comporta funcao é um agente
    - objetos
    - funcoes
- Selecao
  - estruturas de conidcao, definem para onde vai o fluxo conforme
  o dado. utilizado quando nao se sabe o que executar, antes de ter a informacao.
  - if/else
  - switch
- Repeticao
  - estuturas repetíveis
  - for
  - while
  - do-while
- try catch
- Files (Layers)
  - todo dado tem um endereco
  - toda funcao tem um endereco
  - os enderecos podem ser sólidos ou abstratos
- Solidos x abstratos
  - sólido o que tem endreco fisico
  - abstrato nao possuinendereco fisico
    - estruturas universais
- publico / privado
  - dados e funcoes podem ser publicas ou privadas
  - publicas queme sta de forma possui acesso
    - public ou export
  - privada sao os que apenas dentro da caixa, estado tem acesso
    - private ou dados ou fucnoes especificadas no arquivo/contexto
-------------------
- boas praticas de desenvlvimenot
  - solid
- padroes de projeto
  - factory
  - singleton
- similares a OOP x flow
  - instaciacao de uma classe similar ao flow..




Roteiro (capítulos): [`roteiro.md`](roteiro.md)

Exemplos AST/SVG: [`indice-ast.html`](indice-ast.html) · lib [`novo/ast/fn-svg.ts`](../novo/ast/fn-svg.ts)

"A picture is worth a thousand words." – Confucius, 552–479 BCE

ref
https://github.com/laerciogermano/flow-oriented-programming
https://flow-ide.laerciogermano.com/#T-60