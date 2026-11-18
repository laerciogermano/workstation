# Linguagem Flow — conceito, funcionamento e uso no Flow IDE

> “Nada é permanente, exceto a mudança.” — Heráclito

**Por quê:** juntar num lugar só a teoria do artigo Flow, as regras da linguagem e o jeito de usar cada coisa no Flow IDE.
**Base:** [`../../aulas/Livro Flow Oriented Programming.txt`](../../aulas/Livro%20Flow%20Oriented%20Programming.txt) · [`../../flow-language/README.md`](../../flow-language/README.md) · protótipo [`../prototipo/`](../prototipo/).
**Como ler:** a Parte I diz *o que é*. A Parte II diz *como a linguagem funciona*. A Parte III mostra *o mesmo fluxo em JS, TS e C*. A Parte IV mostra *onde cada conceito fica na ferramenta*.

---

## Objetivo

- Mostrar que as regras do desenvolvimento de software não mudam. O que muda são os elementos: linguagem, biblioteca, plataforma e pessoa.
- Explicar como o roteiro (fluxo) é separado do ator (quem executa) e do estado (os dados).
- Mostrar que um fluxo desenhado uma vez pode ser exportado para qualquer linguagem.

---

# Parte I — O conceito

## 1. Software são roteiros

Um software é um **roteiro** que trabalha com informação. O programador é um **roteirista**: em vez de cenas reais, ele controla uma máquina de estados.

Todo roteiro responde a quatro perguntas:

| Pergunta | No software |
|----------|-------------|
| **Quem** | o agente (responsável) que executa |
| **O quê** | o verbo, ou seja, a função |
| **Quando** | a ordem: sequência, paralelo, seleção ou repetição |
| **Para o quê** | o estado final que se quer alcançar |

> Exemplo do bolo: os **ingredientes** são os dados, a **receita** é o roteiro e a **pessoa** é o agente. Troque a pessoa e o bolo continua o mesmo. Troque a receita e muda o bolo.

## 2. Dado e função: estado e movimento

O software é feito de **estados** e **movimentos**.

- O **dado** guarda informação. É uma caixa com **nome** e **conteúdo** (número, texto, booleano…). Ele pode ter **campos filhos** (uma árvore), mas não precisa ter.
- A **função** processa a informação. Ela é um **verbo**: *comprar celular*, *enviar proposta*, *gerar contrato*. Ela recebe entradas, muda o estado e devolve saídas.

> Entradas → processamento → saídas. “Entra porco, sai linguiça.”

## 3. Símbolos: abstratos e sólidos

Toda linguagem é feita de **símbolos**. Cada símbolo é um **endereço**.

| | Abstrato | Sólido (concreto) |
|---|---|---|
| O que é | um **espaço** ainda vazio, um personagem sem ator | o que **preenche** o espaço |
| Endereço | não definido | definido (físico) |
| Forma | isomórfico (forma) | polimórfico (matéria) |
| Exemplo | `dados_cliente` que ninguém da camada produz | `dados_cliente` com valor, ou produzido na mesma camada |

Um **roteiro abstrato** tem endereços não preenchidos. Um **roteiro sólido** tem todos os endereços definidos. **Para executar, todos os objetos precisam estar presentes.**

## 4. Agentes

O **agente** é quem comanda e/ou executa uma operação. Ele é a origem do movimento, a “fonte de energia” do verbo.

- **Cliente** comanda e **servidor** executa. Um agente pode ser os dois na mesma operação.
- Cada agente tem os seus próprios roteiros e pode ter mais de uma responsabilidade.
- O roteiro **não depende** do agente: trocar o agente (por exemplo, outra biblioteca ou outra IA) não muda o roteiro.

## 5. Ordem, seleção e repetição

| Estrutura | Formas |
|-----------|--------|
| **Ordem** | sequencial · paralela |
| **Seleção** | if / else · switch |
| **Repetição** | for · while · do while · recursão |

Uma instrução pode ter **instruções filhas**. Assim surge a **composição**: um verbo grande feito de verbos menores.

## 6. Camadas e módulos

**Endereços que se conhecem** ficam na mesma **camada**. Um dado produzido dentro da camada é sólido ali dentro. Um dado que vem de fora (de outra camada, ou do *state*) é abstrato.

- **O que muda junto fica junto.** Esse é o critério para escolher o módulo.
- A camada é **substituível**: dá para trocar o ator, a biblioteca ou o objeto sem reescrever o roteiro.

## 7. Bons roteiristas

- Separam **roteiro**, **agente** e **estado**.
- Dependem de **abstrações**, com entradas de *setup* (injeção) e entradas de execução.
- Escolhem nomes do domínio. **Funções são verbos, dados são substantivos.**
- Fazem software maleável: a mudança deve custar o menor esforço possível.

---

# Parte II — Como a linguagem Flow funciona

## 8. Elementos da linguagem

| Elemento | Regra | Notação |
|----------|-------|---------|
| **Função** | nome sempre **verbo no infinitivo** (Comprar…, Enviar…, Fazer…) | `○` |
| **Composição** | função com funções filhas; o tempo dela vai do primeiro ao último filho | `○` com filhos |
| **Dado** | substantivo em `snake_case`; tem **tipo**; pode ter **campos filhos** (`dados_cliente.contatos.email`) | `□` sólido · `■` abstrato |
| **Entrada / saída** | endereço nomeado; uma função tem *n* entradas e *n* saídas | `in` / `out` |
| **Estado `sN`** | divisória entre passos; o que existe no `s3` é o acúmulo dos dados até ali | `s0 … sN` |
| **Responsável** | quem executa: agente de IA, biblioteca, **script próprio** ou pessoa | avatar |
| **Módulo** | arquivo que guarda **dados e funções** que mudam juntos | `*.layer.js` · `*.data.js` |
| **state** | o que chega de fora da camada (dados e agentes abstratos) | `function f(state)` |

### Tipos de dado

| Flow | JS | TS | C |
|------|----|----|---|
| Texto | `string` | `string` | `char*` |
| Número | `number` | `number` | `double` |
| Inteiro | `number` | `number` | `int` |
| Booleano | `boolean` | `boolean` | `bool` |
| Data | `Date` | `Date` | `time_t` |
| Lista | `Array` | `T[]` | `T*` + tamanho |
| Objeto (com campos filhos) | `{…}` | `interface` | `struct` |
| Arquivo | caminho / `Blob` | `Blob` | `FILE*` |

## 9. Regra do preenchimento (sólido × abstrato)

Uma regra só vale para dado e para função: **algo fica sólido quando tudo o que está dentro dele está preenchido.**

| Símbolo | Quando |
|---------|--------|
| Função **sólida** (preenchida na cor) | a folha tem responsável; a composição tem **todas** as filhas preenchidas |
| Função **preta** | é uma composição e **alguma filha ainda falta preencher** |
| Função **vazada** | folha sem responsável (espaço abstrato) |
| Dado **sólido** `□` | tem valor, ou é produzido na mesma camada; com campos, quando **todos** os campos têm valor |
| Dado **abstrato** `■` | vem de fora da camada e ainda não tem valor |

Se a raiz está sólida, o roteiro pode executar. Se está preta, basta seguir o preto até achar o que falta.

## 10. Composição

| Estrutura | No fluxo | Leitura |
|-----------|----------|---------|
| Sequência | `a → b` | b começa quando a termina |
| Paralelo | `a ∥ b` | mesmo passo `sN` |
| Seleção | `◇ if (proposta_aprovada)` | o corpo só roda se o teste passar; `senão ↺` volta ao passo indicado |
| Repetição | `↻ for (idioma of ["en", "es"])` | a função roda uma vez por item |

## 11. Notação de leitura

O canvas é a fonte de verdade. Para escrever um fluxo num documento, este texto usa a notação abaixo, que é a mesma estrutura do FOP-IR exportado:

```text
módulo proposta.layer.js

dado dados_cliente: objeto {
  nome: texto
  cnpj: texto
  contatos: lista { email: texto, telefone: texto }
}
dado proposta_aprovada: booleano

função Fazer onboarding da Acme(state) {
  Coletar dados do cliente()        -> dados_cliente        @ node:http
  Rascunhar proposta(dados_cliente) -> rascunho             @ agente Lia
  Revisar proposta(rascunho)        -> proposta_aprovada    @ agente Davi
  if (proposta_aprovada) {
    paralelo {
      for (idioma of ["en", "es"]) Traduzir proposta(proposta_aprovada, idioma) -> proposta_{idioma} @ agente Teo
      Gerar contrato(proposta_aprovada, dados_cliente) -> contrato, resumo_juridico           @ script gerarContrato()
    }
    Enviar ao cliente(proposta_en, proposta_es, contrato) -> envio_id @ node:http
  } senão ↺ Rascunhar proposta
}
```

- `@` = responsável. Ele é **injetado**, não faz parte do roteiro. Trocar `@ agente Lia` por `@ script rascunhar()` não muda o fluxo.
- `-> x` = saída. O nome da saída vira o endereço de entrada de quem vem depois.

---

# Parte III — Transpilação

O mesmo fluxo (resumido) em três linguagens. O desenho é igual nas três: **cada função recebe o `state`, as funções que se conhecem são importadas (concretas) e o que vem de fora chega pelo `state` (abstrato).**

### Flow (entrada)

```text
função Ativar cliente(state) {
  paralelo {
    Agendar kickoff(envio_id)          -> kickoff     @ agente Lia
    Criar conta no sistema(dados_cliente) -> conta_id @ node:http
  }
  Gerar credenciais(conta_id) -> credenciais          @ node:crypto
  for (contato of dados_cliente.contatos)
    Enviar boas-vindas(credenciais, contato) -> boas_vindas @ script montarBoasVindas()
}
```

### JavaScript

```js
// Gerado pelo Flow.dev · camada "ativar-cliente"
import { criarContaNoSistema } from './criar-conta-no-sistema.js';   // concreto (mesma camada)
import { gerarCredenciais } from './gerar-credenciais.js';
import { montarBoasVindas } from './credenciais.layer.js';           // script próprio

export async function ativarCliente(state) {
  const { envio_id, dados_cliente, lia } = state;                     // abstratos: chegam de fora

  const [{ kickoff }, { conta_id }] = await Promise.all([             // paralelo
    lia.agendarKickoff({ ...state, envio_id }),
    criarContaNoSistema({ ...state, dados_cliente }),
  ]);
  const { credenciais } = await gerarCredenciais({ ...state, conta_id });

  const boas_vindas = await Promise.all(                              // repetição
    dados_cliente.contatos.map(contato => montarBoasVindas({ ...state, credenciais, contato }))
  );
  return { kickoff, conta_id, credenciais, boas_vindas };
}
```

### TypeScript

```ts
// Tipos vêm do tipo de cada dado (Explorar › Dados › Tipo)
export interface Contato { email: string; telefone: string }
export interface DadosCliente { nome: string; cnpj: string; contatos: Contato[] }
export interface Credenciais { usuario: string; senha: string }

export interface Agente { agendarKickoff(i: { envio_id: string }): Promise<{ kickoff: Date }> }

export interface StateAtivar {          // endereços abstratos da camada
  envio_id: string;
  dados_cliente: DadosCliente;
  lia: Agente;                          // responsável injetado
}
export interface SaidaAtivar { kickoff: Date; conta_id: string; credenciais: Credenciais; boas_vindas: string[] }

import { criarContaNoSistema } from './criar-conta-no-sistema';
import { gerarCredenciais } from './gerar-credenciais';
import { montarBoasVindas } from './credenciais.layer';

export async function ativarCliente(state: StateAtivar): Promise<SaidaAtivar> {
  const { envio_id, dados_cliente, lia } = state;
  const [{ kickoff }, { conta_id }] = await Promise.all([
    lia.agendarKickoff({ envio_id }),
    criarContaNoSistema({ dados_cliente }),
  ]);
  const { credenciais } = await gerarCredenciais({ conta_id });
  const boas_vindas = await Promise.all(
    dados_cliente.contatos.map((contato: Contato) => montarBoasVindas({ credenciais, contato })),
  );
  return { kickoff, conta_id, credenciais, boas_vindas };
}
```

### C

```c
/* Gerado pelo Flow.dev · camada "ativar-cliente"
 * objeto -> struct · lista -> ponteiro + tamanho · responsável -> ponteiro de função (injeção) */
#include <stdlib.h>
#include <time.h>
#include <pthread.h>

typedef struct { char *email; char *telefone; } Contato;
typedef struct { char *nome; char *cnpj; Contato *contatos; int n_contatos; } DadosCliente;
typedef struct { char *usuario; char *senha; } Credenciais;

typedef struct {                                   /* state: endereços abstratos */
  char *envio_id;
  DadosCliente *dados_cliente;
  time_t (*agendar_kickoff)(const char *envio_id); /* agente Lia, injetado */
} StateAtivar;

typedef struct { time_t kickoff; char *conta_id; Credenciais credenciais; char **boas_vindas; } SaidaAtivar;

/* concretos: mesma camada */
char *criar_conta_no_sistema(const DadosCliente *d);
Credenciais gerar_credenciais(const char *conta_id);
char *montar_boas_vindas(const Credenciais *c, const Contato *contato);   /* script próprio */

typedef struct { StateAtivar *st; time_t kickoff; } ArgKickoff;
static void *kickoff_job(void *p) { ArgKickoff *a = p; a->kickoff = a->st->agendar_kickoff(a->st->envio_id); return NULL; }

SaidaAtivar ativar_cliente(StateAtivar *state) {
  SaidaAtivar out = {0};

  /* paralelo: kickoff ∥ criar conta */
  pthread_t t; ArgKickoff a = { state, 0 };
  pthread_create(&t, NULL, kickoff_job, &a);
  out.conta_id = criar_conta_no_sistema(state->dados_cliente);
  pthread_join(t, NULL);
  out.kickoff = a.kickoff;

  /* sequência */
  out.credenciais = gerar_credenciais(out.conta_id);

  /* repetição: for (contato of dados_cliente.contatos) */
  int n = state->dados_cliente->n_contatos;
  out.boas_vindas = malloc(sizeof(char *) * n);
  for (int i = 0; i < n; i++)
    out.boas_vindas[i] = montar_boas_vindas(&out.credenciais, &state->dados_cliente->contatos[i]);
  return out;
}
```

### Seleção nas três

```text
Flow:  if (proposta_aprovada) { Traduzir proposta … } senão ↺ Rascunhar proposta
```

```js
// JS / TS
while (true) {
  ({ rascunho } = await state.lia.rascunharProposta({ dados_cliente }));
  ({ proposta_aprovada } = await state.davi.revisarProposta({ rascunho }));
  if (proposta_aprovada) break;          // senão ↺ volta ao rascunho
}
```

```c
/* C */
do {
  rascunho = state->rascunhar_proposta(dados_cliente);
  proposta_aprovada = state->revisar_proposta(rascunho);
} while (!proposta_aprovada);
```

### O que a transpilação preserva

| Flow | JS | TS | C |
|------|----|----|---|
| Função (verbo) | `async function` | `async function` tipada | função |
| Composição | função que chama as filhas | idem | idem |
| Dado com campos | objeto | `interface` | `struct` |
| Paralelo | `Promise.all` | `Promise.all` | `pthread` |
| Repetição | `map` / `for` | `map` / `for` | `for` |
| Seleção / `senão ↺` | `if` / `while` | `if` / `while` | `if` / `do while` |
| Abstrato (fora da camada) | campo do `state` | campo de `State…` | campo do `struct State…` |
| Concreto (mesma camada) | `import` | `import` | protótipo + link |
| Responsável | objeto injetado no `state` | interface injetada | ponteiro de função |

---

# Parte IV — Na ferramenta (Flow IDE)

## 12. Mapa conceito → tela

| Conceito | Onde fica | Como usa |
|----------|-----------|----------|
| Função / composição | **Explorar › Funções** e linhas do **Flow** | ícone sólido = tudo preenchido · preto = falta filha · vazado = sem responsável |
| Nome = verbo | renomear (F2) ou criar | o nome é recusado se não começar com verbo (Comprar…, Enviar…, Fazer…) |
| Dado | **Explorar › Dados** | clique abre o painel: **Tipo**, **Valor** e **Módulo** |
| Dado em árvore | caret ▸ no dado · `+` no hover · “+ Campo” no painel | campo filho = `pai.campo`; o pai fica sólido quando todos os campos têm valor |
| Sólido × abstrato | `□` e `■` no Flow (s0…sN) e cubos no Explorar | clique no `■` → definir valor → vira `□` e vai para o módulo |
| Estados `sN` | eixo do Flow | sob cada sN: folha = □, árvore (com filhos) = cubo |
| Responsável | coluna **Responsável** do Flow | select: **Scripts (meus módulos)**, Bibliotecas Node.js, Agentes, Pessoas |
| Script próprio | **Explorar › Módulos** (`ƒ nome()`) | uma função escrita por você que pode ser responsável de qualquer etapa |
| Módulo | **Explorar › Módulos** | guarda **dados e funções** que mudam juntos (antes chamado “Arquivos”) |
| Seleção / repetição | linhas `◇ if` e `↻ for` | abrir a linha mostra o corpo; hover → remover (`rm-if` / `rm-loop`) na toolbar acima |
| Exportar | botão **Exportar** | gera JS a partir do mesmo modelo (TS e C seguem a Parte III) |
| Esta teoria | **Explorar › Docs** | cada conceito com o exemplo vivo do IDE; o botão do bloco “No Flow IDE” abre o lugar exato no Flow |

## 13. Editar o fluxo

1. **Clique** num elemento (linha ou barra). Ele fica selecionado e aparece a barra **Editar · Filho · Irmão**, como na Árvore do Plans.
2. **Editar** abre a janela de edição (título, contexto, responsável, entradas e saídas).
3. **Novo** cria um **elemento filho**. Se o elemento ainda não tinha filhos, ele vira composição.
4. **Novo irmão** cria o próximo passo logo abaixo e herda a sequência (a → novo → b).
5. O nome já nasce editável. **Enter** confirma e **Esc** cancela, devolvendo a sequência como estava.

| Atalho (elemento selecionado no Flow) | Ação |
|---|---|
| Enter | novo irmão abaixo |
| ⇧ Enter | novo irmão acima |
| Tab | novo filho |
| F2 | renomear |
| ⌫ (com ⌘) | remover |

## 14. Explorar

- Cada seção (Funções, Dados, Módulos, Pessoas, Agentes, Modelos) abre e fecha pelo título.
- **Funções** mostra só funções. Não há agrupadores do tipo “Pessoal” ou “Site institucional”: o que não é verbo não entra.
- O hover numa função mostra **Editar · Filho · Irmão**; o hover num dado mostra **Editar · Novo campo**.

## 15. Do desenho ao código

```text
desenhar (Flow)  →  preencher (responsáveis + valores)  →  raiz sólida  →  Executar / Exportar
```

Quando a raiz do fluxo está sólida, o roteiro está completo: todo verbo tem quem execute e todo dado tem de onde vir.

---

## Glossário

| Termo | Definição curta |
|-------|-----------------|
| Roteiro / fluxo | sequência de verbos que leva de um estado inicial a um estado final |
| Função | verbo; unidade de mudança de estado |
| Dado | substantivo; unidade de informação, com tipo e campos opcionais |
| Abstrato | endereço vazio: dado sem valor vindo de fora, ou função sem responsável |
| Sólido | endereço preenchido |
| Agente / responsável | quem executa a função (IA, biblioteca, script, pessoa) |
| Camada | endereços que se conhecem |
| Módulo | arquivo com dados e funções de uma camada |
| state | entrada de fora da camada, por onde chegam os abstratos |
