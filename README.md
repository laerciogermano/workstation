# Workstation

Hub de projetos, board, tasks e processo de desenvolvimento.

---

## Atalhos

### Núcleo

| | Seção | Descrição |
|:--:|:------|:----------|
| 📊 | [**Board**](core/board/README.md) | Gantts por projeto (cronograma / esforço) |
| ✅ | [**Tasks**](core/tasks/README.md) | Árvore de execução + kanban Todo / Doing / Done |
| 🔄 | [**Processo**](core/processo/README.md) | Ciclo completo: discovery → manutenção, com entradas, execução e saídas |

#### Fases do processo

| | Fase | Descrição |
|:--:|:-----|:----------|
| 🔍 | [Discovery](core/processo/discovery/README.md) | Visão (funcionalidades + capa) e épicos (histórias, BDD, protótipos HF) |
| 🧩 | [Refinamento técnico](core/processo/refinamento-tecnico/README.md) | Arquitetura, riscos e backlog executável |
| 💻 | [Desenvolvimento](core/processo/desenvolvimento/README.md) | Implementar o que foi acordado |
| 🧪 | [Testes](core/processo/testes/README.md) | Validar comportamento e qualidade |
| 🚀 | [Implantação](core/processo/implantacao/README.md) | Publicar no ambiente alvo |
| 🛠️ | [Manutenção](core/processo/manutencao/README.md) | Operar, corrigir e evoluir |

```text
🔍 Discovery → 🧩 Refinamento → 💻 Desenvolvimento → 🧪 Testes → 🚀 Implantação → 🛠️ Manutenção
```

---

### Projetos

| | Projeto | Descrição | Links |
|:--:|:--------|:----------|:------|
| 🔤 | [**Flow Language**](flow-language/) | Linguagem ↔ visualização de fluxo (IR, sync) | [visão](flow-language/README.md) · [docs](flow-language/docs/) · [config IA](flow-language/config/config-ia.md) |
| 🌊 | [**Flow**](flow/) | Fundamentos de fluxo — pré-requisito do Plans | [visão](flow/README.md) · [épicos](flow/epics/) · [tasks](flow/tasks/) |
| 📅 | [**Plans**](plans/) | Planejamento sobre o Flow | [visão](plans/README.md) · [docs](plans/docs/) · [config IA](plans/config/config-ia.md) |
| 🌐 | [**Chines**](chines/) | Aprendizado de chinês | [docs](chines/docs/) · [config IA](chines/config/config-ia.md) |
| 🚗 | [**Caronas**](caronas/) | Caronas compartilhadas | [visão](caronas/README.md) · [docs](caronas/docs/) · [config IA](caronas/config/config-ia.md) |
| 🏋️ | [**Fitness**](fitness/) | Fitness e treinos | [visão](fitness/README.md) · [docs](fitness/docs/) · [config IA](fitness/config/config-ia.md) |
| 🤖 | [**ConnectMax**](connectmax/) | Automação de tela + vendas | [visão](connectmax/README.md) · [screen-robot](connectmax/screen-robot/) · [vendas](connectmax/vendas/) · [config IA](connectmax/config/config-ia.md) |
| 📖 | [**Eternos Mutáveis**](eternos-mutaveis/) | Manuscrito / tese | [visão](eternos-mutaveis/README.md) · [docs](eternos-mutaveis/docs/) · [config IA](eternos-mutaveis/config/config-ia.md) |
| 🥋 | [**Jiu-jitsu**](jiu-jitsu/) | App de jiu-jitsu | [visão](jiu-jitsu/README.md) · [docs](jiu-jitsu/docs/) · [config IA](jiu-jitsu/config/config-ia.md) |
| 🎭 | [**RoleGo**](role-go/) | Role-playing / go | [visão](role-go/README.md) |
| ✨ | [**Clozzy**](clozzy/) | Venda de conteúdos exclusivos de influencers | [visão](clozzy/README.md) · [docs](clozzy/docs/) · [config IA](clozzy/config/config-ia.md) |

---

## Ordem de desenvolvimento

```text
Flow Language  →  Flow  →  Plans
```

O **Flow Language** é pré-requisito do **Flow**: define a tradução
bidirecional linguagem ↔ visualização de fluxo (IR, entradas, saídas,
sincronização em tempo real) em [`flow-language/`](flow-language/).

O **Flow** é pré-requisito do **Plans**. Para desenvolver o Plans, é
necessário desenvolver primeiro os fundamentos de fluxo definidos em
[`flow/`](flow/), que por sua vez consomem o Flow Language.

### Esteira (Flow Language)

```text
Visão → Funcionalidades → Histórias → BDD → Telas → Screens BDD → Componentes → Protótipo
```

Prompts: [`flow-language/prompts/timeline.md`](flow-language/prompts/timeline.md).

### Esteira (Plans)

```text
Inputs → Visão → Histórias → BDD → Telas → Screens BDD → Componentes → Protótipo
```

### Esteira (Chines)

```text
Inputs → Histórias → BDD → Telas → Componentes → Protótipo
```

### Esteira (Caronas)

```text
Visão → Funcionalidades → Histórias → BDD → Telas → Screens BDD → Componentes → Protótipo
```

Prompts: [`caronas/prompts/timeline.md`](caronas/prompts/timeline.md).

### Esteira (Fitness)

```text
Visão → Funcionalidades → Histórias → BDD → Telas → Screens BDD → Componentes → Protótipo
```

Prompts: [`fitness/prompts/timeline.md`](fitness/prompts/timeline.md).

### Esteira (ConnectMax)

```text
screen-robot: visão → planos → F0…F4 em sources/android-control
vendas:       visão → functionalities → user-stories → … → prototype
```

Prompts: [`connectmax/prompts/timeline.md`](connectmax/prompts/timeline.md).  
Projetos: [`screen-robot`](connectmax/screen-robot/) · [`vendas`](connectmax/vendas/).

### Esteira (Eternos Mutáveis)

```text
Visão → Tese → Estrutura → Capítulos → Manuscrito
```

Prompts: [`eternos-mutaveis/prompts/timeline.md`](eternos-mutaveis/prompts/timeline.md).

### Esteira (Jiu-jitsu)

```text
Visão → Funcionalidades → Histórias → BDD → Telas → Screens BDD → Componentes → Protótipo
```

Prompts: [`jiu-jitsu/prompts/timeline.md`](jiu-jitsu/prompts/timeline.md).

### Esteira (Clozzy)

```text
Visão → Funcionalidades → Histórias → BDD → Telas → Screens BDD → Componentes → Protótipo
```

Prompts: [`clozzy/prompts/timeline.md`](clozzy/prompts/timeline.md).
