# Flow Language — Visão

**O quê:** ferramenta de criação de código.  
**Como:** você manipula o código de forma visual.  
**Para onde:** exporta para qualquer linguagem; **neste momento: JavaScript e Python**.

Pré-requisito do [`flow/`](../flow/).  
Épicos: [`epics.md`](epics.md) · Docs: [`docs/`](docs/) · Prompts: [`prompts/`](prompts/) · Config IA: [`config/config-ia.md`](config/config-ia.md)

Fundamentos: [Flow-Oriented Programming](docs/laerciogermano_flow-oriented-programming.pdf) · [Teoria sistêmica (Medium)](docs/Systemic%20Ontological%20Metaphysical%20Philosophical%20Theory%20-%20Laércio%20Germano%20-%20Medium.pdf)

---

## Definição

O **Flow Language** é uma ferramenta de **criação de código** em que o código é **manipulado visualmente** (nós, entradas, saídas e ligações) e pode ser **exportado para qualquer linguagem**.

Base conceitual: **Flow-Oriented Programming (FOP)** — paradigma visual em que o fluxo de execução é composto por **dados** e **funções**, com desacoplamento por camadas substituíveis.

Neste momento, os alvos de exportação são:

| Alvo | Status |
|------|--------|
| **JavaScript** | Em escopo |
| **Python** | Em escopo |
| Outras linguagens | Previstas; fora do foco atual |

## Modelo (FOP)

| Conceito | Definição |
|----------|-----------|
| **Fluxo** | Dados + funções |
| **Dado** | Unidade de informação |
| **Função** | Unidade de mudança de estado |
| **Entrada / Saída** | Endereços nomeados (n entradas, n saídas por função) |
| **Contexto** | Conjunto de entradas; a execução ocorre quando a camada está completa |
| **Camada** | Endereços que se conhecem; unidade substituível |
| **Composição** | Sequência, paralelo, seleção, repetição |

Estado observável + mudança = o que o Flow descreve e sistematiza no canvas.

## O que faz (v1)

| Capacidade | Descrição |
|------------|-----------|
| Edição visual | Criar e alterar código no canvas (funções, dados, entradas, saídas, ligações, composição) |
| Exportação | Gerar código em JavaScript e Python a partir do modelo visual |
| Multi-linguagem | Arquitetura permite novos alvos de exportação sem redefinir a ferramenta |

## Fora de escopo (v1)

- Exportação para linguagens além de JavaScript e Python
- Board, Gantt, Explorar, responsáveis (são do Flow / Plans)
- Persistência, permissões, multi-usuário

## Relação

```text
FOP (fundamentos)  →  Flow Language  →  Flow  →  Plans
 (modelo)              (criação visual)   (produto)  (gestão)
```

## Próximos passos

→ [`epics.md`](epics.md) · [`docs/README.md`](docs/README.md)
