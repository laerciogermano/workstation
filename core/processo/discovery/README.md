# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

## Entradas

- Demanda, ideia ou problema reportado
- Contexto de negócio e restrições conhecidas
- Stakeholders e usuários envolvidos
- Dados existentes (métricas, feedback, concorrência)

## Execução

- Mapear problema, usuários e valor esperado
- Definir métricas de sucesso e delimitar escopo (in / out)
- Inventariar **todas as funcionalidades** (título, descrição, capa)
- Agrupar em **épicos** e detalhar cada um: histórias, BDD e protótipos de alta fidelidade
- Validar entendimento com stakeholders

## Saídas

O discovery devolve **dois documentos**:

### 1. Documento de visão

Apresentação de **todas as funcionalidades** do produto. Cada funcionalidade traz:

| Campo | Conteúdo |
|-------|----------|
| **Título** | Nome da funcionalidade |
| **Descrição** | O que faz e para quem / por quê |
| **Capa** | Imagem de capa (visual da funcionalidade) |

A visão é a fonte de verdade do *quê* e do *porquê* — catálogo narrativo das capacidades, não o detalhe de aceite.

### 2. Documento de épicos

Conjunto de **todos os épicos**, cada um contendo:

| Artefato | Papel |
|----------|--------|
| **Histórias** | O *quê* desejado (Como… quero… para…) |
| **BDD** | Critérios de aceite (Dado / Quando / Então) |
| **Protótipos de alta fidelidade** | UI fidelidade alta que materializa a história / épico |

Épicos ligam a visão ao trabalho executável: o detalhe de comportamento e a UI de referência saem daqui.

## Próximo passo

→ [Refinamento técnico](../refinamento-tecnico/) — arquitetura, riscos e backlog técnico a partir da visão e dos épicos
