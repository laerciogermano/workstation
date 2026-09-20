# Workstation

Hub de projetos, board, tasks e processo de desenvolvimento.

---

## Atalhos

### Núcleo

| | Seção | Descrição |
|:--:|:------|:----------|
| ✅ | [**Tasks**](core/tasks/README.md) | Árvore de execução, Gantt e kanban Todo / Doing / Pendente aprovação / Done |
| 🔄 | [**Processo**](core/processo/README.md) | Ciclo completo: discovery → manutenção, com entradas, execução e saídas |

#### Fases do processo

| | Fase | Descrição |
|:--:|:-----|:----------|
| 🔍 | [Discovery](core/processo/1.discovery/README.md) | Stories → epics → roadmap; refinar estória (scenarios → BDDs → protótipo? → tasks); depois o ciclo por estória |
| 🧩 | [Refinamento técnico](core/processo/2.refinamento-tecnico/README.md) | Arquitetura, riscos, backlog e pasta `tasks/` (`TSK-<nn>-<titulo>`) |
| 💻 | [Desenvolvimento](core/processo/3.desenvolvimento/README.md) | Por IA na ordem do Gantt: TDD → PR → Pendente aprovação; próximo robô só após humano |
| 🧪 | [Testes](core/processo/4.testes/README.md) | Validar comportamento e qualidade |
| 🚀 | [Implantação](core/processo/5.implantacao/README.md) | Publicar no ambiente alvo |
| 🛠️ | [Manutenção](core/processo/6.manutencao/README.md) | Operar, corrigir e evoluir |

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
| 📱 | [**screen-robot**](screen-robot/README.md) | Robô de tela Android (Node/ADB) | [visão](screen-robot/README.md) · [tasks](screen-robot/tasks/README.md) · [sources](screen-robot/src/README.md) |
| 🤖 | [**ConnectMax**](connectmax/README.md) | Agente LinkedIn + vendas (consome screen-robot) | [visão](connectmax/README.md) · [linkedin-agent](connectmax/linkedin-agent/README.md) · [vendas](connectmax/vendas/README.md) · [config IA](connectmax/config/config-ia.md) |
| 📖 | [**Eternos Mutáveis**](eternos-mutaveis/) | Manuscrito / tese | [visão](eternos-mutaveis/README.md) · [docs](eternos-mutaveis/docs/) · [config IA](eternos-mutaveis/config/config-ia.md) |
| 🥋 | [**Jiu-jitsu**](jiu-jitsu/) | App de jiu-jitsu | [visão](jiu-jitsu/README.md) · [docs](jiu-jitsu/docs/) · [config IA](jiu-jitsu/config/config-ia.md) |
| 🎭 | [**RoleGo**](role-go/) | Role-playing / go | [visão](role-go/README.md) |
| ✨ | [**Clozzy**](clozzy/) | Venda de conteúdos exclusivos de influencers | [visão](clozzy/README.md) · [docs](clozzy/docs/) · [config IA](clozzy/config/config-ia.md) |
