# workstation

Board: [`core/tasks/`](core/tasks/README.md) · Processo: [`core/processo/`](core/processo/README.md)

## Projetos

| Projeto | Visão | Documentação | Config IA |
|---------|-------|--------------|-----------|
| [Flow Language](flow-language/) | [`flow-language/README.md`](flow-language/README.md) | [`flow-language/docs/`](flow-language/docs/) | [`flow-language/config/config-ia.md`](flow-language/config/config-ia.md) |
| [Flow](flow/) | [`flow/README.md`](flow/README.md) | [`flow/epics/`](flow/epics/), [`flow/tasks/`](flow/tasks/) | — |
| [Plans](plans/) | [`plans/README.md`](plans/README.md) | [`plans/docs/`](plans/docs/) | [`plans/config/config-ia.md`](plans/config/config-ia.md) |
| [Chines](chines/) | [`chines/docs/`](chines/docs/) | [`chines/docs/`](chines/docs/) | [`chines/config/config-ia.md`](chines/config/config-ia.md) |
| [Caronas](caronas/) | [`caronas/README.md`](caronas/README.md) | [`caronas/docs/`](caronas/docs/) | [`caronas/config/config-ia.md`](caronas/config/config-ia.md) |
| [Fitness](fitness/) | [`fitness/README.md`](fitness/README.md) | [`fitness/docs/`](fitness/docs/) | [`fitness/config/config-ia.md`](fitness/config/config-ia.md) |
| [ConnectMax](connectmax/) | [`connectmax/README.md`](connectmax/README.md) | [`screen-robot`](connectmax/screen-robot/) · [`vendas`](connectmax/vendas/) | [`connectmax/config/config-ia.md`](connectmax/config/config-ia.md) |
| [Eternos Mutáveis](eternos-mutaveis/) | [`eternos-mutaveis/README.md`](eternos-mutaveis/README.md) | [`eternos-mutaveis/docs/`](eternos-mutaveis/docs/) | [`eternos-mutaveis/config/config-ia.md`](eternos-mutaveis/config/config-ia.md) |
| [Jiu-jitsu](jiu-jitsu/) | [`jiu-jitsu/README.md`](jiu-jitsu/README.md) | [`jiu-jitsu/docs/`](jiu-jitsu/docs/) | [`jiu-jitsu/config/config-ia.md`](jiu-jitsu/config/config-ia.md) |

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
