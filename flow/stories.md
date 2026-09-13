# Flow — histórias de usuário

Estas histórias derivam do [documento de visão](README.md) e dos materiais
em [`input/`](input/). Cada história está escrita como uma **Feature**,
com a intenção do usuário.

## Personas

- **Modelador de fluxo** — define dados, funções e relações entre etapas.
- **Executor de fluxo** — fornece o contexto e inicia uma execução válida.
- **Acompanhador** — acompanha etapas, prazos, progresso e recursos.
- **Mantenedor** — inspeciona contratos e substitui camadas do fluxo.

---

## Feature: Definir dados e estados

Como **modelador de fluxo**, quero **definir unidades de informação e
agrupá-las em estados**, para que **o fluxo represente explicitamente os
dados que circulam pelo processo**.

---

## Feature: Definir funções de mudança de estado

Como **modelador de fluxo**, quero **definir funções como unidades de
mudança de estado**, para que **cada transformação do processo tenha uma
unidade clara e independente**.

---

## Feature: Modelar entradas e saídas

Como **modelador de fluxo**, quero **definir múltiplos endereços de entrada
e saída para uma função**, para que **as dependências entre transformações
sejam expressas sem limitar o fluxo a um único valor**.

---

## Feature: Usar endereços concretos e abstratos

Como **modelador de fluxo**, quero **usar endereços concretos ou abstratos
para dados e funções**, para que **o fluxo possa trabalhar tanto com
implementações definidas quanto com dependências fornecidas depois**.

---

## Feature: Receber e retornar funções pelo contexto

Como **mantenedor**, quero **fornecer dados e funções como entradas e
receber dados ou funções como saídas**, para que **uma parte do fluxo possa
ser reutilizada com diferentes implementações**.

---

## Feature: Compor funções em sequência

Como **modelador de fluxo**, quero **compor funções sequencialmente**, para
que **uma etapa só comece depois que a etapa anterior produzir seu estado**.

---

## Feature: Compor funções em paralelo

Como **modelador de fluxo**, quero **executar em paralelo funções que não
dependem umas das outras**, para que **o fluxo aproveite atividades
independentes sem criar uma ordem artificial**.

---

## Feature: Modelar seleção condicional

Como **modelador de fluxo**, quero **definir caminhos condicionais**, para
que **o processo execute somente as etapas correspondentes ao estado
produzido**.

---

## Feature: Modelar repetição

Como **modelador de fluxo**, quero **definir trechos que podem ser
executados novamente**, para que **o processo represente iterações sem
duplicar funções no modelo**.

---

## Feature: Organizar endereços em camadas

Como **mantenedor**, quero **organizar endereços que se conhecem em
camadas**, para que **cada parte do fluxo tenha limites de conhecimento e
possa ser substituída com segurança**.

---

## Feature: Montar o contexto de execução

Como **executor de fluxo**, quero **fornecer todas as entradas de dados e
funções exigidas**, para que **o fluxo só seja iniciado com um contexto
completo**.

---

## Feature: Visualizar o fluxo como composição

Como **modelador de fluxo**, quero **visualizar dados, funções, entradas,
saídas e relações de composição**, para que **eu consiga compreender o
processo antes e durante sua execução**.

---

## Feature: Acompanhar o fluxo em uma linha do tempo

Como **acompanhador**, quero **visualizar as etapas em uma linha do tempo
semelhante a um Gantt**, para que **eu acompanhe início, duração, progresso
e recursos sem perder a estrutura do processo**.

---

## Feature: Executar o fluxo e atualizar o estado

Como **executor de fluxo**, quero **executar um fluxo válido e acompanhar
as mudanças de estado produzidas por suas funções**, para que **o resultado
da execução seja observável e corresponda ao modelo**.

---

## Feature: Inspecionar contratos e dependências

Como **mantenedor**, quero **inspecionar os contratos de entrada, saída e
dependência de cada parte**, para que **eu encontre incompatibilidades sem
precisar executar todo o processo**.

---

## Feature: Manter equivalência entre modelo visual e executável

Como **modelador de fluxo**, quero **que a composição visual e a execução
representem o mesmo fluxo**, para que **uma alteração no processo não crie
uma lógica diferente da que foi modelada**.

---

## Regras comuns às features

- Um fluxo válido é composto por dados, funções e relações explícitas.
- Uma função pode possuir zero ou mais entradas e zero ou mais saídas.
- Endereços podem representar dados ou funções e podem ser concretos ou
  abstratos.
- Sequência, paralelo, seleção e repetição são estruturas diferentes e não
  devem ser tratadas como a mesma relação.
- O contexto precisa estar completo antes da execução.
- Uma camada só pode ser substituída quando mantém os endereços e
  contratos esperados pelas demais camadas.
- Datas, duração, progresso e recursos são informações de acompanhamento;
  não substituem as relações semânticas entre dados e funções.
