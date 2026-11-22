# Flow — Apresentação da linguagem

> “Uma imagem vale mais que mil palavras.” — Confúcio  ·  “Nada é permanente, exceto a mudança.” — Heráclito

**O que é este documento:** a apresentação da linguagem Flow, na ordem do [`indice.txt`](indice.txt). Cada seção explica o conceito e mostra um exemplo no formato usado no Flow Language: o **fluxo** (notação de leitura do canvas) e o **código gerado** em JavaScript e Python.
**Onde ver desenhado:** editor [`flow-language/editor`](../../flow-language/editor/README.md) · Flow IDE https://flow-ide.laerciogermano.com · fundamentos: [Flow-Oriented Programming](https://github.com/laerciogermano/flow-oriented-programming).
**Referências internas:** [`linguagem-flow.md`](../../flow-dev/docs/linguagem-flow.md) (regras e transpilação) · [`roteiro.md`](roteiro.md) · [`boas-praticas-desenvolvimento.md`](boas-praticas-desenvolvimento.md).

## Como ler os exemplos

No canvas, o fluxo aparece com duas colunas, **Source** (quem executa) e **Function** (o que muda), e com estados `s0 … sN` entre os passos. Aqui o mesmo fluxo é escrito em texto:

```text
função Verbo no infinitivo(entradas) -> saída   @ source
```

| Símbolo | Significa |
|---|---|
| `○` / `função` | função (verbo no infinitivo) |
| `□` / `■` | dado sólido (tem valor) / dado abstrato (vem de fora) |
| `->` | saída; o nome vira o endereço de entrada de quem vem depois |
| `@` | source: arquivo, pessoa, IA, biblioteca ou script |
| `sN` | estado: tudo o que existe até aquele passo |
| `∥` | paralelo (mesmo `sN`) |

---

## 1. Flow

Flow é uma **linguagem de programação visual**. Ela tem as features das linguagens de programação (funções, dados, seleção, repetição, módulos) e **transpila para qualquer linguagem**; hoje, JavaScript e Python.

| Ideia | O que muda na prática |
|---|---|
| Código vira visão | O fluxo é um desenho (barras, estados, dados), não um arquivo de texto |
| Visão logística de todos os fluxos | Dá para ver o conjunto como um orquestrador de processos, parecido com o n8n |
| Gerenciador de tarefas | Cada função é uma tarefa com source (responsável) e estado |
| Componentes substituíveis | Troca-se arquivo, pessoa, IA ou biblioteca sem mexer no fluxo |

**Por que visual.** Ver uma imagem é mais fácil do que ler texto. Entender código em texto exige muito esforço cognitivo: é como jogar xadrez sem ver o tabuleiro, só com as posições escritas. Até aqui não havia uma forma tão fiel de enxergar software; o Flow dá face ao que antes não era visto, com todos os recursos de programação.

**O mesmo fluxo, três formas**

Desenho (canvas):

```text
        s0                 s1                  s2
Source  ├───────────────────┼───────────────────┤   Function
arquivo ├── Receber pedido ─┤                       ○
Ana     │                   ├── Separar itens ──┤   ○
        │                       pedido □  itens □
```

Texto (notação Flow):

```text
função Atender pedido(state) {
  Receber pedido()       -> pedido   @ arquivo pedidos.json
  Separar itens(pedido)  -> itens    @ pessoa Ana
}
```

Código gerado (JavaScript):

```js
export async function atenderPedido(state) {
  const { pedido } = await receberPedido({ ...state });
  const { itens } = await separarItens({ ...state, pedido });
  return { pedido, itens };
}
```

Código gerado (Python):

```python
async def atender_pedido(state):
    pedido = (await receber_pedido({**state}))["pedido"]
    itens = (await separar_itens({**state, "pedido": pedido}))["itens"]
    return {"pedido": pedido, "itens": itens}
```

No editor Flow Language o painel **Código** mostra esse resultado ao vivo, enquanto o fluxo é desenhado.

---

## 2. Softwares

Software é feito de **fluxos de execução**. Um fluxo de execução é formado por **dados** e **funções**. É um roteiro: quem faz, o quê, quando e para quê.

| Pergunta | No Flow |
|---|---|
| Quem | o agente (source) |
| O quê | a função (verbo) |
| Quando | a ordem: sequência, paralelo, seleção, repetição |
| Para quê | o estado final |

```text
função Fazer bolo(state) {
  Misturar ingredientes(ingredientes) -> massa   @ pessoa Ana
  Assar(massa)                        -> bolo    @ máquina forno
}
```

Os **ingredientes** são dados, a **receita** é o fluxo, a **pessoa** é o agente. Trocar a pessoa não muda o bolo; trocar a receita, sim.

---

## 3. Funções

Função é a **unidade de transformação**. Pode ter entrada, processamento e saída (n entradas, n saídas). O nome é sempre um **verbo no infinitivo**: *Cobrar cliente*, *Enviar proposta*.

```text
função Calcular total(preco, quantidade) -> total
```

```js
function calcularTotal({ preco, quantidade }) {
  return { total: preco * quantidade };
}
```

```python
def calcular_total(preco, quantidade):
    return {"total": preco * quantidade}
```

**Composição.** Uma função pode conter outras (filhas). O tempo da função pai vai do primeiro ao último filho. É assim que um verbo grande é feito de verbos menores:

```text
função Vender produto(state) {          ← composição
  Cobrar cliente(cliente)  -> pagamento
  Entregar pedido(pagamento) -> entrega
  Faturar(entrega)         -> nota
}
```

**Funções são componentes substituíveis.** Quem chama conhece só o nome e os endereços de entrada e saída; a implementação pode ser trocada em qualquer contexto, com desacoplamento em nível de serviço.

---

## 4. Dados

Dados são as **unidades transformáveis**: entram (input), são transformados e saem (output). Cada dado é uma caixa com **nome** (substantivo em `snake_case`) e **tipo**.

| Tipo Flow | JavaScript | Python |
|---|---|---|
| texto | `string` | `str` |
| número | `number` | `float` / `int` |
| booleano | `boolean` | `bool` |
| função | `function` | `Callable` |
| array (lista) | `Array` | `list` |
| obj (objeto, “caixa”) | `{…}` | `dict` / classe |

**Objetos (caixas)** são seres que reúnem dados e funções. No Flow, um dado pode ter **campos filhos**:

```text
dado cliente: objeto {
  nome: texto
  idade: numero
  contatos: lista { email: texto, telefone: texto }
}
dado aprovado: booleano
```

```js
const cliente = {
  nome: "Maria",
  idade: 31,
  contatos: [{ email: "maria@acme.com", telefone: "11 99999-0000" }],
};
const aprovado = true;
```

```python
cliente = {
    "nome": "Maria",
    "idade": 31,
    "contatos": [{"email": "maria@acme.com", "telefone": "11 99999-0000"}],
}
aprovado = True
```

**Estado.** O que existe em `s3` é o acúmulo dos dados produzidos até ali. Todo ato liga um estado inicial a um estado final, passando por um movimento (a função). Funções também são dados: podem ser passadas como entrada, por exemplo um parâmetro substituível.

---

## 5. Agentes

Agente é a **estrutura fonte da execução**: quem realiza o trabalho, a origem do movimento. No canvas é a coluna **Source**.

| Tipo de source | Exemplo | Na notação |
|---|---|---|
| Arquivo | `main`, `pedidos.json` | `@ arquivo main` |
| Pessoa | Ana, da Logística | `@ pessoa Ana` |
| IA | Redator (Opus) | `@ agente Redator` |
| Biblioteca / máquina | `node:fs`, `node:http` | `@ node:fs` |
| Script próprio | `gerarContrato()` | `@ script gerarContrato()` |

```text
função Publicar artigo(state) {
  Escrever rascunho(tema)  -> rascunho  @ agente Redator
  Revisar texto(rascunho)  -> texto     @ pessoa Davi
  Salvar texto(texto)      -> caminho   @ node:fs
}
```

O source é **injetado**, não faz parte do roteiro. Trocar `@ agente Redator` por `@ script escrever()` não altera o fluxo:

```js
export async function publicarArtigo(state) {
  const { redator, davi, fs } = state;             // sources injetados
  const { rascunho } = await redator.escreverRascunho({ tema: state.tema });
  const { texto } = await davi.revisarTexto({ rascunho });          // pessoa: a execução espera a resposta
  const { caminho } = await fs.salvarTexto({ texto });
  return { rascunho, texto, caminho };
}
```

Um agente pode ser cliente (comanda) e servidor (executa) na mesma operação, e pode ter mais de uma responsabilidade.

---

## 6. Seleção

Seleção são as **estruturas de condição**. Definem para onde o fluxo vai conforme o dado. Usa-se quando não se sabe o que executar antes de ter a informação.

### if / else

```text
função Aprovar pedido(state) {
  Consultar estoque(pedido) -> estoque_ok
  ◇ if (estoque_ok) {
    Reservar itens(pedido) -> reserva
  } senão {
    Avisar cliente(pedido) -> aviso
  }
}
```

```js
const { estoque_ok } = await consultarEstoque({ pedido });
if (estoque_ok) {
  ({ reserva } = await reservarItens({ pedido }));
} else {
  ({ aviso } = await avisarCliente({ pedido }));
}
```

```python
estoque_ok = (await consultar_estoque({"pedido": pedido}))["estoque_ok"]
if estoque_ok:
    reserva = (await reservar_itens({"pedido": pedido}))["reserva"]
else:
    aviso = (await avisar_cliente({"pedido": pedido}))["aviso"]
```

O corpo do `if` só roda se o teste passar. A variante `senão ↺ Rascunhar proposta` volta a um passo anterior (vira um `while` no código).

### switch

```text
◇ switch (pedido.tipo) {
  "assinatura": Ativar plano(pedido)
  "avulso":     Cobrar uma vez(pedido)
  padrão:       Rejeitar pedido(pedido)
}
```

```js
switch (pedido.tipo) {
  case "assinatura": await ativarPlano({ pedido }); break;
  case "avulso":     await cobrarUmaVez({ pedido }); break;
  default:           await rejeitarPedido({ pedido });
}
```

```python
match pedido["tipo"]:
    case "assinatura": await ativar_plano({"pedido": pedido})
    case "avulso":     await cobrar_uma_vez({"pedido": pedido})
    case _:            await rejeitar_pedido({"pedido": pedido})
```

---

## 7. Repetição

Estruturas repetíveis: a função roda uma vez por item, ou enquanto uma condição valer.

### for

```text
↻ for (idioma of ["en", "es"]) Traduzir proposta(proposta, idioma) -> proposta_{idioma}
```

```js
for (const idioma of ["en", "es"]) {
  traducoes[idioma] = await traduzirProposta({ proposta, idioma });
}
```

```python
for idioma in ["en", "es"]:
    traducoes[idioma] = await traduzir_proposta({"proposta": proposta, "idioma": idioma})
```

### while

```text
↻ while (!proposta_aprovada) {
  Rascunhar proposta(dados_cliente) -> rascunho
  Revisar proposta(rascunho)        -> proposta_aprovada
}
```

```js
let proposta_aprovada = false;
while (!proposta_aprovada) {
  const { rascunho } = await rascunharProposta({ dados_cliente });
  ({ proposta_aprovada } = await revisarProposta({ rascunho }));
}
```

### do-while

Executa ao menos uma vez e só então testa:

```js
let proposta_aprovada;
do {
  const { rascunho } = await rascunharProposta({ dados_cliente });
  ({ proposta_aprovada } = await revisarProposta({ rascunho }));
} while (!proposta_aprovada);
```

```python
while True:
    rascunho = (await rascunhar_proposta({"dados_cliente": dados_cliente}))["rascunho"]
    proposta_aprovada = (await revisar_proposta({"rascunho": rascunho}))["proposta_aprovada"]
    if proposta_aprovada:
        break
```

**Paralelo e sequência** completam a ordem. `∥` coloca funções no mesmo estado `sN`:

```text
paralelo {
  Agendar kickoff(envio_id)             -> kickoff   @ agente Lia
  Criar conta no sistema(dados_cliente) -> conta_id  @ node:http
}
```

```js
const [{ kickoff }, { conta_id }] = await Promise.all([
  lia.agendarKickoff({ envio_id }),
  criarContaNoSistema({ dados_cliente }),
]);
```

---

## 8. Files (Layers)

**Todo dado tem um endereço. Toda função tem um endereço.** Os endereços ficam organizados em **arquivos (camadas)**. Endereços que se conhecem ficam na mesma camada; o que muda junto fica junto.

| Na camada | Como chega | No código |
|---|---|---|
| Função ou dado da mesma camada | concreto | `import` / mesmo arquivo |
| Dado ou agente de fora | abstrato | campo do `state` |

```text
módulo ativar-cliente.layer.js

função Ativar cliente(state) {
  Criar conta no sistema(dados_cliente) -> conta_id    @ node:http
  Gerar credenciais(conta_id)           -> credenciais @ node:crypto
}
```

```js
// ativar-cliente.layer.js
import { criarContaNoSistema } from "./criar-conta-no-sistema.js";   // concreto: mesma camada
import { gerarCredenciais } from "./gerar-credenciais.js";

export async function ativarCliente(state) {
  const { dados_cliente } = state;                                   // abstrato: chega de fora
  const { conta_id } = await criarContaNoSistema({ dados_cliente });
  const { credenciais } = await gerarCredenciais({ conta_id });
  return { conta_id, credenciais };
}
```

As entradas são o **contexto** da camada: quando todas estão presentes, a camada está completa e pode executar. Por serem parâmetros, funcionam como **injeção de dependência**: a camada é substituível.

---

## 9. Sólidos × abstratos

| | Sólido | Abstrato |
|---|---|---|
| Endereço | físico (arquivo, valor, pessoa definida) | sem endereço físico |
| Dado | `□` tem valor ou é produzido na camada | `■` vem de fora e ainda não tem valor |
| Função | tem source (folha) ou todas as filhas preenchidas | folha sem source (espaço vazio) |
| Papel | preenche o espaço | estrutura universal, a forma |

**Regra única:** algo fica sólido quando tudo o que está dentro dele está preenchido. Para executar, tudo precisa estar sólido.

```text
função Enviar cobrança(state) {
  Gerar boleto(cliente)    -> boleto    @ node:http     ← sólida
  Notificar cliente(boleto) -> aviso                    ← abstrata (sem source)
}
```

No desenho, a função com source aparece preenchida; a sem source aparece vazada, e a composição que contém essa lacuna aparece preta. Basta seguir o preto até achar o que falta. Funções abstratas podem receber endereços abstratos e devolver concretos quando recebem um source.

```js
// "Notificar cliente" ainda é abstrata: vira um campo do state, sem corpo
const { notificarCliente } = state;
```

---

## 10. Público / privado

Dados e funções podem ser **públicos** ou **privados**.

| | Quem acessa | Como no código |
|---|---|---|
| **Público** | qualquer um que esteja de fora | `public` / `export` |
| **Privado** | apenas a caixa (o estado, o arquivo/contexto) | `private`, ou o que não é exportado do arquivo |

```text
módulo pagamento.layer.js

público  função Cobrar cliente(cliente) -> pagamento
privado  função Calcular juros(valor)   -> juros
privado  dado   taxa: numero = 0.02
```

```js
// pagamento.layer.js
const taxa = 0.02;                                   // privado: só este arquivo vê

function calcularJuros({ valor }) {                  // privado
  return { juros: valor * taxa };
}

export async function cobrarCliente({ cliente }) {   // público: a interface da camada
  const { juros } = calcularJuros({ valor: cliente.divida });
  return { pagamento: cliente.divida + juros };
}
```

```python
# pagamento.py
_taxa = 0.02                      # privado (convenção do prefixo _)

def _calcular_juros(valor):       # privado
    return valor * _taxa

def cobrar_cliente(cliente):      # público (listado em __all__)
    return {"pagamento": cliente["divida"] + _calcular_juros(cliente["divida"])}

__all__ = ["cobrar_cliente"]
```

Só o que é público forma o contrato da camada. O resto pode mudar sem afetar quem usa.

---

## 11. Boas práticas de desenvolvimento

### SOLID no Flow

| Princípio | Como o Flow expressa |
|---|---|
| **S**ingle responsibility | cada função é um verbo, uma mudança de estado; cada source tem papel único |
| **O**pen/closed | adiciona-se função ou source sem alterar o fluxo existente |
| **L**iskov | qualquer source com as mesmas entradas e saídas substitui outro (`@ agente Lia` ↔ `@ script rascunhar()`) |
| **I**nterface segregation | cada função declara só as entradas de que precisa |
| **D**ependency inversion | o fluxo depende de endereços abstratos; o source é injetado pelo `state` |

```js
// Depende da abstração (rascunhar), não de quem executa
export async function fazerProposta({ dados_cliente, rascunhar }) {
  const { rascunho } = await rascunhar({ dados_cliente });
  return { rascunho };
}

fazerProposta({ dados_cliente, rascunhar: lia.rascunharProposta });     // IA
fazerProposta({ dados_cliente, rascunhar: rascunharComModelo });        // script próprio
```

### Outras práticas

- Separe **roteiro** (função), **agente** (source) e **estado** (dado).
- **Funções são verbos, dados são substantivos**, com nomes do domínio.
- Mantenha juntos os endereços que mudam juntos.
- Faça software maleável: a mudança deve custar o menor esforço possível.

---

## 12. Padrões de projeto

Os padrões clássicos aparecem no Flow como uma disposição de funções, dados e camadas.

### Factory

Função cuja **saída é um source (ou objeto) montado conforme a entrada**:

```text
função Criar notificador(canal) -> notificador
  ◇ switch (canal) {
    "email": Montar email()   -> notificador  @ node:smtp
    "sms":   Montar sms()     -> notificador  @ node:http
  }
```

```js
export function criarNotificador({ canal }) {
  switch (canal) {
    case "email": return { notificador: { enviar: enviarPorEmail } };
    case "sms":   return { notificador: { enviar: enviarPorSms } };
  }
}

const { notificador } = criarNotificador({ canal: "email" });
await notificador.enviar({ mensagem });
```

```python
def criar_notificador(canal):
    match canal:
        case "email": return {"enviar": enviar_por_email}
        case "sms":   return {"enviar": enviar_por_sms}
```

### Singleton

Um endereço, uma instância. Na linguagem, **todo dado ou função tem um único endereço**: um dado público de uma camada é a mesma caixa para todos que o importam.

```text
módulo config.data.js
público dado configuracao: objeto { url_api: texto, timeout: numero }
```

```js
// config.data.js — o módulo é carregado uma vez; todos recebem a mesma caixa
export const configuracao = { url_api: "https://api.acme.com", timeout: 5000 };
```

```python
# config.py — importado uma vez, compartilhado
configuracao = {"url_api": "https://api.acme.com", "timeout": 5000}
```

---

## 13. OOP × Flow

| | OOP | Flow |
|---|---|---|
| Unidade | objeto: dado e comportamento acoplados | função e dado separados |
| Foco | quem (o objeto) | o que e quando (a ordem dos eventos) |
| Reuso | herança / composição de classes | substituição de camadas e sources |
| Estado | dentro do objeto | no `state`, visível a cada `sN` |
| Visão | texto | desenho do fluxo |

**Instanciação ≈ Flow.** Instanciar uma classe é chamar uma função que devolve uma caixa com dados:

```js
// OOP
class Pedido {
  constructor(cliente, itens) { this.cliente = cliente; this.itens = itens; }
  total() { return this.itens.reduce((s, i) => s + i.preco, 0); }
}
const pedido = new Pedido(cliente, itens);
pedido.total();
```

```text
// Flow: função e dado separados
dado pedido: objeto { cliente: objeto, itens: lista }

função Criar pedido(cliente, itens) -> pedido
função Calcular total(pedido)       -> total
```

```js
// Flow transpilado
const criarPedido = ({ cliente, itens }) => ({ pedido: { cliente, itens } });
const calcularTotal = ({ pedido }) => ({ total: pedido.itens.reduce((s, i) => s + i.preco, 0) });

const { pedido } = criarPedido({ cliente, itens });
const { total } = calcularTotal({ pedido });
```

O construtor é a função `Criar pedido`; o método é a função `Calcular total` que recebe a caixa como entrada. O objeto deixa de ser ator e passa a ser o **acúmulo de dados** entre verbos. Para quem vem de OOP, é uma ponte: a mesma lógica, com dado e movimento visíveis em separado.

---

## Resumo

| Conceito | Em uma linha |
|---|---|
| Flow | linguagem visual que transpila para qualquer linguagem |
| Software | fluxos de execução = dados + funções |
| Função | unidade de transformação (verbo) |
| Dado | unidade transformável (texto, número, booleano, função, objeto, array) |
| Agente | a fonte da execução: arquivo, pessoa, IA, biblioteca |
| Seleção | if/else, switch |
| Repetição | for, while, do-while |
| Files (layers) | todo dado e toda função tem um endereço |
| Sólido × abstrato | físico × espaço a preencher |
| Público / privado | o que a camada expõe × o que só ela vê |
| Boas práticas e padrões | SOLID, factory, singleton |
| OOP × Flow | a classe vira função + dado separados |
