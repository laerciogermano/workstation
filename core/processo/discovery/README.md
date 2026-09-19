# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

O discovery tem **duas fases** em sequência:

1. **Fase 1** — criar o [documento de visão](#fase-1--documento-de-visão)
2. **Fase 2** — criar o [documento de épicos](#fase-2--documento-de-épicos)

## Entradas

- Demanda, ideia ou problema reportado
- Contexto de negócio e restrições conhecidas
- Stakeholders e usuários envolvidos
- Dados existentes (métricas, feedback, concorrência)

## Execução

### Fase 1 — Documento de visão

- Mapear problema, usuários e valor esperado
- Definir métricas de sucesso e delimitar escopo (in / out)
- Inventariar **todas as funcionalidades** (título, descrição, capa)
- Validar o *quê* com stakeholders

### Fase 2 — Documento de épicos

A partir da visão, agrupar funcionalidades em **épicos**.

Cada **cenário** representa **uma mudança de estado do sistema** (estado anterior → ação → estado resultante). Para cada um, nesta ordem:

1. Definir o **cenário BDD** (Dado / Quando / Então)
2. Criar o **protótipo de alta fidelidade maior**
3. Criar o **protótipo de alta fidelidade** do cenário

Também registrar as **histórias** do épico (Como… quero… para…) e validar o conjunto com stakeholders.

## Saídas

### Fase 1 — Documento de visão

Apresentação de **todas as funcionalidades** do produto. Cada funcionalidade traz:

| Campo | Conteúdo |
|-------|----------|
| **Título** | Nome da funcionalidade |
| **Descrição** | O que faz e para quem / por quê |
| **Capa** | Imagem de capa (visual da funcionalidade) |

A visão é a fonte de verdade do *quê* e do *porquê* — catálogo narrativo das capacidades, não o detalhe de aceite.

### Fase 2 — Documento de épicos

Conjunto de **todos os épicos**, cada um contendo:

| Artefato | Papel | Ordem |
|----------|--------|-------|
| **Histórias** | O *quê* desejado (Como… quero… para…) | — |
| **Cenários BDD** | Uma mudança de estado do sistema; critérios de aceite (Dado / Quando / Então) | 1º por cenário |
| **Protótipo de alta fidelidade maior** | UI de referência ampla do cenário / fluxo | 2º por cenário |
| **Protótipo de alta fidelidade** | UI fidelidade alta que materializa o cenário | 3º por cenário |

Épicos ligam a visão ao trabalho executável: o detalhe de comportamento e a UI de referência saem daqui, sempre com BDD antes dos protótipos.

## Próximo passo

→ [Refinamento técnico](../refinamento-tecnico/) — arquitetura, riscos e backlog técnico a partir da visão e dos épicos
