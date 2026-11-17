# Flow.dev — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do Flow IDE antes de histórias, telas ou código.  
**Importante:** fonte de verdade do produto — fatia do Plans só com **Explorar + Flow**.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → protótipo.

Derivados: [`docs/`](docs/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).  
Refs: artigo [`../aulas/README.md`](../aulas/README.md) · Plans [`../plans/README.md`](../plans/README.md) · input visual [`inputs/gantt-sample.png`](inputs/gantt-sample.png).

**URL protótipo (Flow IDE):** https://flow-ide.laerciogermano.com/ · deploy: [`deploy/README.md`](deploy/README.md)

---

## Visão

O **Flow.dev** é o **IDE de programação orientada a fluxo**: o lugar onde se **explora** o projeto como arquivos e se **desenha** o roteiro na tela **Flow** (plano cartesiano FOP). Cada etapa tem um **agente tipado** — **IA** ou **biblioteca Node.js** — sem misturar o roteiro com o ator.

É a mesma ideia do **Flow** do Plans, sem Board, Gantt, Fluxograma, Árvore, Estados/Metas nem Copiloto. Tela Flow no visual de [`inputs/gantt-sample.png`](inputs/gantt-sample.png): tabela **Nome · Início · Passos · % feito · Agente**, barras com progresso por composição, conectores e marcos. Fundamento teórico: o documento [`../flow/input/Programação Orientada a Fluxo.docx`](../flow/input/) e o artigo Flow.

## Problema

IDEs e automações acoplam **roteiro** e **executor**, ou escondem o fluxo em texto linear. Quem quer programar visualmente com **IA e libs Node** no mesmo canvas não tem um IDE só de Flow.

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Modelador de fluxo** | Desenhar FOP e exportar código |
| **Orquestrador IA + máquina** | Atribuir Claude/GPT ou `node:fs` / `node:http` por etapa |
| **Aluno do artigo Flow** | Ver abstração, entrada, verbo e saída no IDE |

## Objetivo

Ser o **Flow IDE**: Explorar + Flow, agentes **IA** e **bibliotecas Node.js** (v1), exportação via FOP-IR.

## Proposta de valor

| Necessidade | O que o Flow.dev faz |
|-------------|----------------------|
| Ver o projeto como arquivos | Explorar (estilo IDE) |
| Desenhar o roteiro | Flow cartesiano (□ na divisória; task abaixo) |
| Escolher quem executa | Catálogo IA · Node.js |
| Programar etapa máquina | Editor com módulos `node:*` |
| Reusar em código | Export TypeScript / Python |

## Recursos FOP na tela Flow

| Conceito (documento FOP) | No Flow |
|---|---|
| Estado (e0, e1, e2…) | divisórias do eixo, rotuladas no cabeçalho |
| Função (mudança de estado) | barra de eN a eN+1, com passos e % feito |
| Dado (unidade de informação) | □ sobre a divisória (entrada/saída) · ao final de cada função, chips com o **bag acumulado** do estado de saída (eN) · sob cada eN no rodapé, a mesma lista acumulada |
| n entradas / n saídas | detalhe da etapa + assinatura `function f(context)` |
| Sequência | conector (botão **Sequência** liga/desliga) |
| Paralelo | tag `∥ paralelo` · `Promise.all` no export |
| Seleção | ◇ no conector + faixa `if (…)` sobre o corpo · “senão ↺” volta (recursão) |
| Repetição | moldura tracejada + arco ↻ `for (var of lista)` · `for`/`map` ou recursão no export |
| Endereço concreto × abstrato | **vazado = concreto, sólido = abstrato** (itens 6–9): função Node.js = barra preenchida (concreta, `import`) · IA = barra só com borda (abstrata, vem do `context`) · dado de entrada da mesma camada = □, de outra camada / context = ■ · saídas sempre □ |
| Camada recebe abstratos (itens 15, 19) | cada composição mostra à esquerda os ■ dados e ▬ funções que pede ao `context`; cabeçalho conta camadas · abstratos · concretos e diz se o contexto está completo (executável) |
| Camada substituível · contexto completo | painel **Contexto · camadas** e selo no cabeçalho |
| Exportar JS/Python | Exportar → **JavaScript** (estilo do documento), TypeScript, Python |

## Princípios

1. **Só Flow** — uma tela de composição + Explorar transversal.
2. **Roteiro × ator** — trocar IA/lib não reescreve o fluxo.
3. **Node na v1** — bibliotecas = módulos Node (`node:fs`, `node:http`, …).
4. **FOP visível** — entrada, verbo, saída no plano cartesiano.
5. **Mesma unidade** — arquivo no Explorar = etapa no Flow.

## Escopo v1

| Em escopo | Fora |
|-----------|------|
| Explorar · Flow · catálogo IA/Node · editor de lib · export TS/Py | Board, Gantt, pessoas como agente, runtimes além de Node |

## Relação com outros projetos

| Projeto | Papel |
|---------|--------|
| [`aulas/`](../aulas/README.md) | Teoria Flow |
| [`flow/`](../flow/README.md) | Fundamentos / épicos anteriores |
| [`plans/`](../plans/README.md) | Orquestrador completo (inclui Flow + outras visões) |
| [`flow-language/`](../flow-language/README.md) | IR / linguagem |

## Protótipo

[`prototipo/`](prototipo/) — alta fidelidade a partir do Plans, cortado para Explorar + Flow. Tema padrão **Gantt** = [`inputs/gantt-sample.png`](inputs/gantt-sample.png).

## Caminho inverso

- Voltar ao Plans completo: https://plans.laerciogermano.com/ · pasta [`../plans/`](../plans/README.md)
- Tirar o subdomínio: ver [`deploy/README.md`](deploy/README.md) (rollback)
- Card no hub: [`../centralizador/`](../centralizador/README.md)
