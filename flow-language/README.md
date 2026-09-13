# Flow Language — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* da linguagem antes de qualquer produto que a consuma.  
**Importante:** é a fonte de verdade da camada linguagem ↔ visualização — sem ela, o Flow e o Plans divergem na representação do fluxo.  
**No fluxo:** **este documento** → [`docs/`](docs/) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/).  
Timeline de prompts: [`prompts/`](prompts/).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Ordem de dependência:** este projeto é pré-requisito do [`flow/`](../flow/). O Flow consome a linguagem; não a define.

---

## Visão

O **Flow Language** é a camada que **traduz, em tempo real, uma linguagem de fluxo em uma visualização Flow e vice-versa**. Código (ou texto estruturado) vira grafo de **dados**, **funções**, **entradas** e **saídas**; editar a visualização regenera a linguagem equivalente — a mesma fonte de verdade, duas faces.

Em vez de tratar visualização e código como artefatos separados, o Flow Language torna explícito:

- o que a linguagem declara (dados, funções, composição);
- como isso aparece no canvas (nós, ligações, entradas e saídas);
- como uma mudança em um lado atualiza o outro **ao vivo**;
- o contrato intermediário (IR) que preserva o significado entre faces.

### Grande objetivo

Permitir que qualquer fluxo expresso na linguagem seja **visto e editado** como Flow, e que qualquer Flow válido seja **lido e escrito** de volta como linguagem — sem perda de entradas, saídas, composição ou contexto.

## Problema

Hoje, linguagem e visualização de fluxo costumam viver em mundos separados.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Código sem mapa** | O programador vê o texto; perde a forma do fluxo (paralelo, seleção, quem alimenta quem). |
| **Desenho sem fonte** | O diagrama ilustra, mas não regenera o código; vira documentação que apodrece. |
| **Entradas e saídas implícitas** | Dependências ficam escondidas em variáveis locais ou em ordem de chamada. |
| **Atualização assimétrica** | Mudar o código não atualiza o desenho; mudar o desenho não atualiza o código. |
| **Sem IR estável** | Cada ferramenta inventa seu próprio formato; exportar/importar perde significado. |

O Flow Language existe para fechar esse ciclo: **uma representação canônica**, duas projeções sincronizadas.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Autor da linguagem** | Quem escreve o fluxo em texto/código | Ver o grafo ao vivo enquanto edita |
| **Modelador visual** | Quem desenha o fluxo no canvas | Gerar e ajustar a linguagem a partir do desenho |
| **Integrador** | Quem embute a linguagem no Flow / Plans | Consumir IR + visualização sem redefinir o modelo |
| **Revisor** | Quem inspeciona contratos | Ver entradas, saídas e composição sem ler só o texto |

## Objetivo

Ser a **ponte bidirecional** entre a linguagem de fluxo e a visualização Flow: editar um lado atualiza o outro em tempo real, preservando dados, funções, entradas, saídas e estruturas de composição.

## Proposta de valor

| Necessidade | O que o Flow Language faz |
|-------------|---------------------------|
| Entender o código como fluxo | Parsear a linguagem e projetar nós, ligações, entradas e saídas |
| Entender o desenho como código | Serializar o canvas de volta para a linguagem |
| Acompanhar mudanças ao vivo | Manter as duas faces sincronizadas enquanto se edita |
| Nomear dependências | Expor endereços de entrada e saída de forma explícita |
| Compor sem ambiguidade | Representar sequência, paralelo, seleção e repetição nos dois lados |
| Integrar produtos | Entregar IR estável para o Flow (e depois o Plans) consumir |

### Exemplos

**Texto → visual** — Ana escreve uma função com duas entradas e uma saída. Ao lado, o canvas mostra o nó, os pins de entrada/saída e as ligações — sem exportar nada manualmente.

**Visual → texto** — Bruno liga a saída de `f1` à entrada de `f2` no canvas. A linguagem é reescrita com a composição sequencial correspondente.

**Edição ao vivo** — Carla renomeia um endereço de entrada no texto; o pin no canvas atualiza na hora. Ela move a ligação no canvas; o texto reflete a nova dependência.

**IR para o Flow** — O produto Flow carrega um artefato Flow Language (IR + projeção) e monta Gantt/board sem reinventar o modelo de dados e funções.

## Princípios

1. **Bidirecionalidade** — linguagem ↔ visualização; nenhuma face é descartável.
2. **Tempo real** — a projeção acompanha a edição; não é um passo de “gerar diagrama”.
3. **Estado e mudança explícitos** — dados = informação; funções = mudança de estado.
4. **Entradas e saídas nomeadas** — toda ligação tem endereço legível nos dois lados.
5. **Composição sem ambiguidade** — sequência, paralelo, seleção e repetição têm semânticas distintas.
6. **IR como contrato** — a representação intermediária preserva significado entre faces e entre produtos.
7. **Contexto completo** — execução (quando houver) só com as entradas exigidas.
8. **Camadas substituíveis** — endereços que se conhecem formam unidades trocáveis sem quebrar o resto.
9. **O Flow Language precede o Flow** — a UI do Flow consome esta camada; não a redefine.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Linguagem** | Sintaxe/modelo para dados, funções, entradas, saídas e composição |
| **Parser / serialização** | Linguagem → IR e IR → linguagem |
| **Visualização Flow** | Canvas com nós (funções/dados), pins de entrada/saída e ligações |
| **Sincronização ao vivo** | Atualização bidirecional enquanto se edita texto ou canvas |
| **Composição** | Sequência, paralelo, seleção, repetição visíveis e editáveis |
| **IR** | Formato intermediário estável (ex.: FOP-IR) para integração |
| **Validação** | Contexto incompleto, ligações inválidas, ciclos de estado indesejados |
| **Exportação alvo** | Preservar caminho para JS/TS e Python a partir do IR (via Flow/Plans) |

### Fora de escopo (v1)

- Board, Gantt de gestão, Explorar e catálogo de responsáveis (isso é do **Flow** / **Plans**)
- Persistência de projeto, permissões e multi-usuário
- Destinos de exportação além do contrato IR + caminho JS/TS e Python
- Runtime completo de orquestração de IAs (o Flow Language descreve; o executor pode viver no consumidor)

## Modelo conceitual

### Linguagem

Forma textual (ou estruturada) de declarar o fluxo: dados, funções, endereços de entrada/saída e como as funções se compõem.

### Visualização Flow

Projeção espacial do mesmo fluxo: nós, pins, ligações e estruturas de composição legíveis no canvas.

### IR (representação intermediária)

Modelo canônico entre linguagem e visual. É o que o **Flow** (e depois o **Plans**) consome para não acoplar UI à sintaxe de superfície.

### Dado e função

- **Dado** — unidade de informação / estado.
- **Função** — unidade de mudança de estado, com zero ou mais entradas e saídas.

### Entrada e saída

Endereços nomeados. Ligar saída → entrada é o ato central de composição no visual e na linguagem.

### Composição

| Forma | Significado |
|-------|-------------|
| **Sequência** | Uma função termina antes da próxima |
| **Paralelo** | Funções independentes executam juntas |
| **Seleção** | Um caminho depende de uma condição |
| **Repetição** | Um trecho se repete enquanto a condição valer |

### Camada e contexto

Endereços que se conhecem formam uma **camada** substituível. O **contexto** é o conjunto de entradas necessárias; sem contexto completo, não há execução válida.

### Sessão ao vivo

Par editor de linguagem + canvas sincronizados. Qualquer edição válida em um lado atualiza o IR e a outra face.

## Relação com outros projetos

```text
Flow Language  →  Flow  →  Plans
     (linguagem ↔ visual)   (produto de fluxo)   (gestão + FOP no Gantt)
```

| Projeto | Papel |
|---------|--------|
| **Flow Language** | Define e sincroniza linguagem, IR e visualização de fluxo |
| **Flow** | Produto que modela, visualiza e executa processos *usando* Flow Language |
| **Plans** | Gestão de trabalho; Gantt Flow e exportação apoiam-se nos fundamentos de fluxo |

## Critérios de sucesso

- Editar a linguagem atualiza a visualização **sem passo manual de geração**.
- Editar a visualização regenera a linguagem **equivalente** (mesmo IR).
- Entradas e saídas aparecem com nome nos dois lados.
- Sequência, paralelo, seleção e repetição são distinguíveis no canvas e na linguagem.
- O IR carrega o significado completo para o Flow consumir.
- Um fluxo inválido (contexto incompleto, ligação quebrada, ciclo proibido) é sinalizado nos dois lados.
- O documento de visão do Flow permanece alinhado a este modelo, sem redefinir a linguagem.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Flow Language** | Camada bidirecional linguagem ↔ visualização de fluxo |
| **Linguagem** | Forma textual/estruturada do fluxo |
| **Visualização Flow** | Projeção espacial (nós, pins, ligações) |
| **IR** | Representação intermediária canônica |
| **Dado** | Unidade de informação |
| **Função** | Unidade de mudança de estado |
| **Entrada / Saída** | Endereços nomeados de uma função |
| **Composição** | Sequência, paralelo, seleção ou repetição |
| **Camada** | Unidade substituível de endereços que se conhecem |
| **Contexto** | Conjunto de entradas necessárias à execução |
| **Sessão ao vivo** | Edição sincronizada das duas faces |

## Regras de negócio (v1)

- Toda mudança válida na linguagem atualiza o IR e a visualização; toda mudança válida no canvas atualiza o IR e a linguagem.
- Ligação só é válida entre saída e entrada compatíveis (endereços declarados).
- Composições distintas não podem colapsar numa única representação ambígua.
- Contexto incompleto impede marcar o fluxo como executável.
- O Flow e o Plans **não** definem sintaxe própria que contradiga o IR deste projeto; estendem a experiência de produto em cima dele.
- Exportação para JS/TS ou Python parte do IR (direto ou via consumidor), não de um desenho sem modelo.

## Próximos passos

→ [`docs/README.md`](docs/README.md) → inventário de funcionalidades (a produzir)
