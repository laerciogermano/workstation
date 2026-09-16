# Flow Language — Visão

**O quê:** ferramenta de criação de código.  
**Como:** você manipula o código de forma visual.  
**Para onde:** exporta para qualquer linguagem; **neste momento: JavaScript e Python**.

Pré-requisito do [`flow/`](../flow/).  
Épicos: [`epics.md`](epics.md) · Docs: [`docs/`](docs/) · Prompts: [`prompts/`](prompts/) · Config IA: [`config/config-ia.md`](config/config-ia.md)

---

## Definição

O **Flow Language** é uma ferramenta de **criação de código** em que o código é **manipulado visualmente** (nós, entradas, saídas e ligações) e pode ser **exportado para qualquer linguagem**.

Neste momento, os alvos de exportação são:

| Alvo | Status |
|------|--------|
| **JavaScript** | Em escopo |
| **Python** | Em escopo |
| Outras linguagens | Previstas; fora do foco atual |

## O que faz (v1)

| Capacidade | Descrição |
|------------|-----------|
| Edição visual | Criar e alterar código no canvas (funções, dados, entradas, saídas, ligações) |
| Exportação | Gerar código em JavaScript e Python a partir do modelo visual |
| Multi-linguagem | Arquitetura permite novos alvos de exportação sem redefinir a ferramenta |

## Fora de escopo (v1)

- Exportação para linguagens além de JavaScript e Python
- Board, Gantt, Explorar, responsáveis (são do Flow / Plans)
- Persistência, permissões, multi-usuário

## Relação

```text
Flow Language  →  Flow  →  Plans
 (criação visual de código)   (produto de fluxo)   (gestão)
```

## Próximos passos

→ [`epics.md`](epics.md) · [`docs/README.md`](docs/README.md)
