# Flow — documento de visão

Histórias de usuário: [`stories.md`](stories.md).

## Visão

O **Flow** é uma forma de modelar, visualizar e executar processos como
**fluxos de estado**. Um fluxo é composto por **dados**, que representam
informação, e **funções**, que representam mudanças de estado.

Em vez de tratar um processo apenas como uma lista de tarefas, o Flow torna
explícito:

- quais informações entram em cada etapa;
- quais funções transformam essas informações;
- quais dados ou funções são produzidos como saída;
- o que pode acontecer em sequência ou em paralelo;
- quais caminhos dependem de uma seleção ou de uma repetição;
- em que momento o contexto necessário para executar o fluxo está completo.

O Flow deve permitir que esse mesmo processo seja compreendido tanto como
uma composição visual quanto como uma estrutura executável.

### Grande objetivo

O grande objetivo do **Flow** é permitir que um código desenhado
visualmente no Flow seja **exportado como código executável em JavaScript
ou Python**. O desenho do fluxo deve ser a fonte do código gerado:
dados, funções, entradas, saídas e relações de composição precisam ser
preservados na exportação.

## Problema

Processos costumam ser descritos em formatos que mostram apenas parte do
problema. Uma lista de tarefas mostra a ordem, mas esconde os dados
compartilhados. Um código mostra a implementação, mas pode esconder a visão
geral do fluxo. Um cronograma mostra datas e duração, mas nem sempre explica
as relações de entrada e saída entre as etapas.

O Flow organiza essas perspectivas em um único modelo: **informação,
transformação e composição**. Assim, o processo deixa de ser apenas uma
sequência visual e passa a ser um sistema de mudanças de estado que pode ser
inspecionado, substituído e executado.

## Personas principais

O Flow servirá a três personas principais:

| Persona | Necessidade |
|---|---|
| **Gestor de atividades** | Gerir atividades e planos para serem executados por pessoas, acompanhando etapas, prazos, progresso e recursos. |
| **Programador** | Desenvolver códigos e automações modelando dados, funções, dependências e estruturas de execução. |
| **Orquestrador de IA** | Configurar e acompanhar a execução de atividades por IAs a partir do fluxo e do contexto disponíveis. |

## Proposta de valor

O Flow oferece uma linguagem comum para transformar um processo em um fluxo
compreensível e executável:

1. **Modelar** dados e funções.
2. **Conectar** saídas às entradas que as utilizam.
3. **Compor** funções em sequência, paralelo, seleção e repetição.
4. **Visualizar** o fluxo e seu andamento em uma representação adequada,
   incluindo uma visão temporal semelhante a um Gantt.
5. **Executar** o fluxo quando o contexto exigido estiver completo.
6. **Exportar** o fluxo desenhado para código JavaScript ou Python.

## Modelo conceitual

### Fluxo de execução

Um fluxo de execução é composto por dados e funções:

```js
const a = "informação";

function f(context) {
  return context.a;
}
```

O fluxo descreve como essas unidades se relacionam. A função não é apenas
um trecho de código: ela é uma **unidade de mudança de estado**.

### Dado e estado

Um **dado** é uma unidade de informação. Um **estado** pode conter qualquer
quantidade de dados.

```js
const a = "entrada";
const b = "resultado";
```

As entradas e saídas de uma função são endereços de dados ou de outras
funções. Tornar esses endereços explícitos permite acompanhar o estado que
circula pelo processo.

### Função

Uma **função** pode ter vários endereços de entrada e vários endereços de
saída. Ela pode não receber dados, não produzir dados, ou fazer ambos:

```js
function produzir(context) {
  const { a, b, c } = context;
  return { a, b, c };
}
```

Uma função pode receber endereços concretos, como um dado já conhecido, ou
endereços abstratos, como uma função que será fornecida pelo contexto.
Também pode retornar dados e funções como saída.

```js
function criarOperacao() {
  return function operacao() {
    // mudança de estado
  };
}
```

### Composição

Funções podem ser compostas de quatro formas fundamentais:

#### Sequência

Uma função termina antes que a próxima comece:

```js
async function fluxo(context) {
  await f1({ ...context });
  await f2({ ...context });
}
```

#### Paralelo

Funções independentes podem ser executadas juntas:

```js
async function fluxo(context) {
  await Promise.all([
    f1({ ...context }),
    f2({ ...context }),
  ]);
}
```

#### Seleção

Uma condição determina qual parte do fluxo será executada:

```js
async function fluxo(context) {
  const a = await f1({ ...context });

  if (a) {
    await f2({ ...context, a });
  }
}
```

#### Repetição

Uma função pode retornar ao próprio fluxo enquanto uma condição não for
atendida:

```js
async function fluxo(context) {
  const a = await f1({ ...context });

  if (!a) {
    return fluxo({ ...context, a });
  }

  return a;
}
```

Essas estruturas devem permanecer visíveis no modelo, pois representam
decisões diferentes sobre dependência e execução.

## Camadas e contexto

### Camadas

Endereços que conhecem uns aos outros pertencem à mesma **camada**.
Endereços que não se conhecem pertencem a camadas diferentes.

Uma camada é uma unidade substituível. Essa separação permite trocar uma
implementação ou um conjunto de funções sem alterar as demais partes do
fluxo, desde que os endereços de entrada e saída esperados continuem
compatíveis.

Toda entrada forma uma camada. Diferentes camadas, quando combinadas,
formam um contexto.

### Contexto completo

O **contexto** é o conjunto de dados e funções que uma execução precisa
receber. O fluxo só deve ser executado quando esse contexto estiver
completo.

```js
await f({
  a: "entrada",
  f2: () => {},
});
```

Essa regra torna explícito o contrato da execução: uma função não deve
depender de informação escondida fora do seu contexto.

## Visão do produto

O Flow deve apresentar o processo em uma visualização que preserve sua
estrutura e facilite o acompanhamento. O material de referência em
`input/gantt-sample.png` indica uma visão temporal com:

- nome das etapas;
- data de início;
- duração;
- percentual de conclusão;
- recursos associados;
- barras posicionadas ao longo de uma linha do tempo;
- agrupamento e dependência entre atividades.

Essa visualização é uma projeção do fluxo, não a definição completa dele.
Datas, duração e progresso ajudam a acompanhar a execução, enquanto as
entradas, saídas, camadas e estruturas de composição explicam o seu
significado.

## Princípios

1. **Estado explícito** — dados representam o estado que circula pelo fluxo.
2. **Mudança explícita** — funções representam unidades de transformação.
3. **Entradas e saídas nomeadas** — toda conexão deve poder ser entendida por
   seus endereços.
4. **Composição sem ambiguidade** — sequência, paralelo, seleção e repetição
   têm semânticas distintas.
5. **Contexto completo** — não há execução válida sem os dados e funções
   necessários.
6. **Camadas substituíveis** — uma parte do fluxo pode ser trocada mantendo
   seus contratos.
7. **Visualização fiel** — a representação visual deve revelar o fluxo, e
   não apenas decorar uma lista de tarefas.
8. **Separação entre modelo e projeção** — a linha do tempo é uma forma de
   ver o fluxo; o modelo de dados e funções continua sendo a fonte de
   significado.

## Escopo inicial

### Deve representar

- dados e estados;
- funções com múltiplas entradas e saídas;
- endereços concretos e abstratos;
- funções recebidas ou retornadas pelo contexto;
- composição sequencial;
- composição paralela;
- seleção;
- repetição;
- camadas;
- contexto e validação de contexto completo;
- acompanhamento temporal com etapas, duração, progresso e recursos;
- exportação do fluxo para JavaScript ou Python.

### Não está definido pelos materiais de entrada

Os arquivos de entrada não especificam formato de persistência, regras de
permissões, tipos de usuário ou uma interface final. Essas decisões devem
ser definidas em documentos derivados sem alterar os fundamentos desta
visão.

## Critérios de sucesso

- Uma pessoa consegue explicar um processo identificando seus dados,
  funções, entradas e saídas.
- É possível distinguir visualmente uma sequência de uma execução paralela,
  uma seleção e uma repetição.
- Um fluxo não é executado enquanto seu contexto estiver incompleto.
- Uma camada pode ser substituída sem romper os contratos das demais.
- A visão temporal ajuda a acompanhar início, duração, progresso e recursos
  sem esconder a estrutura semântica do fluxo.
- O modelo visual e o modelo executável descrevem o mesmo processo.
- Um fluxo desenhado no Flow pode ser exportado para JavaScript ou Python
  preservando sua lógica de dados, funções e composição.

## Glossário

| Termo | Significado |
|---|---|
| **Fluxo** | Composição de dados e funções que transforma estados |
| **Dado** | Unidade de informação |
| **Estado** | Conjunto de dados em um momento do fluxo |
| **Função** | Unidade de mudança de estado |
| **Endereço** | Identidade de um dado ou função, concreta ou abstrata |
| **Entrada** | Endereço necessário para uma função |
| **Saída** | Endereço produzido por uma função |
| **Camada** | Unidade substituível formada por endereços que se conhecem |
| **Contexto** | Conjunto de entradas necessárias para executar o fluxo |
| **Sequência** | Composição em que uma função sucede outra |
| **Paralelo** | Composição de funções independentes executadas juntas |
| **Seleção** | Composição condicionada por uma decisão |
| **Repetição** | Composição que executa novamente uma função ou trecho |
| **Exportação** | Geração de código JavaScript ou Python a partir do fluxo desenhado |
