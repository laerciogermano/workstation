# Gerenciador de versões — Plans

Planejamento de **entregas** do produto: quais épicos e histórias entram em cada versão.

Fonte de negócio: [`../README.md`](../README.md) · Épicos: [`epics.md`](epics.md) · Histórias: [`stories/user-stories.md`](stories/user-stories.md) · Técnico: [`tech/`](tech/)

```text
Negócio → Épicos → Histórias → Versões (este arquivo) → Refinamento → Implementação
```

Status da versão: `planned` → `in-progress` → `released`.

---

## Mapa rápido

| Versão | Status | EP-00 | EP-01 | EP-02 | EP-03 | EP-04 |
|--------|--------|-------|-------|-------|-------|-------|
| [v1](#v1--núcleo) | planned | US-01, US-02, US-03 | US-04, US-05 | — | — | US-18 |
| [v2](#v2--hierarquia-e-explorar) | planned | — | US-06 | — | — | US-19 |
| [v3](#v3--ia-e-prestadores-no-board) | planned | — | US-07, US-08 | — | — | — |
| [v4](#v4--gantt-básico) | planned | — | — | US-09, US-10, US-11 | — | — |
| [v5](#v5--gantt-avançado) | planned | — | — | US-12 … US-15 | — | — |
| [v6](#v6--árvore-de-execução) | planned | — | — | — | US-16, US-17 | — |

---

## v1 — Núcleo

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Identidade da unidade, catálogo/responsáveis, board básico e persistência |

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-00 Fundamentos | [US-01](stories/user-stories.md#us-01--mesma-unidade-vocabulário-e-ciclo-de-vida) | Mesma unidade, vocabulário e ciclo de vida |
| EP-00 Fundamentos | [US-02](stories/user-stories.md#us-02--atribuir-responsável-tipado) | Atribuir responsável tipado |
| EP-00 Fundamentos | [US-03](stories/user-stories.md#us-03--gerenciar-catálogo-de-responsáveis) | Gerenciar catálogo de responsáveis |
| EP-01 Board | [US-04](stories/user-stories.md#us-04--configurar-colunas-e-raias) | Configurar colunas e raias |
| EP-01 Board | [US-05](stories/user-stories.md#us-05--cadastrar-e-mover-cards) | Cadastrar e mover cards |
| EP-04 Explorar | [US-18](stories/user-stories.md#us-18--persistir-e-abrir-no-explorar) | Persistir e abrir no Explorar |

**Ordem sugerida:** US-01 → US-03 → US-02 → US-04 → US-05 → US-18.

**Dependências:** US-03 antes de US-02; US-01 antes de US-18; US-04 antes de US-05.

**DoR:** US-01, US-02, US-03, US-04, US-05 e US-18 marcadas como `ready` em [`stories/user-stories.md`](stories/user-stories.md).

**Próximo passo:** refinamento técnico em [`tech/refinements/`](tech/refinements/).

---

## v2 — Hierarquia e Explorar

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Hierarquia infinita no board e navegação rica no Explorar |

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-01 Board | [US-06](stories/user-stories.md#us-06--aninhar-e-mover-hierarquia-de-cards) | Aninhar e mover hierarquia de cards |
| EP-04 Explorar | [US-19](stories/user-stories.md#us-19--lista-busca-e-navegação-por-profundidade) | Lista, busca e navegação por profundidade |

---

## v3 — IA e prestadores no Board

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Orquestração de IA e chamados com prestadores |

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-01 Board | [US-07](stories/user-stories.md#us-07--colunas-de-execução-e-orquestração-de-ia) | Colunas de execução e orquestração de IA |
| EP-01 Board | [US-08](stories/user-stories.md#us-08--chamado-e-prestador-de-serviço) | Chamado e prestador de serviço |

---

## v4 — Gantt básico

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Planejamento temporal com planos, dependências e aninhamento |

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-02 Gantt | [US-09](stories/user-stories.md#us-09--planos-ordens-e-datas) | Planos, ordens e datas |
| EP-02 Gantt | [US-10](stories/user-stories.md#us-10--tarefas-sequenciais-e-paralelas) | Tarefas sequenciais e paralelas |
| EP-02 Gantt | [US-11](stories/user-stories.md#us-11--aninhar-tarefas-e-roll-up) | Aninhar tarefas e roll-up |

---

## v5 — Gantt avançado

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Execução via AIs, FOP, máquina como linguagem e exportação |

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-02 Gantt | [US-12](stories/user-stories.md#us-12--execução-de-planos-via-ais) | Execução de planos via AIs |
| EP-02 Gantt | [US-13](stories/user-stories.md#us-13--flow-oriented-programming) | Flow Oriented Programming |
| EP-02 Gantt | [US-14](stories/user-stories.md#us-14--máquina-como-linguagem-no-gantt) | Máquina como linguagem no Gantt |
| EP-02 Gantt | [US-15](stories/user-stories.md#us-15--exportar-código-e-linguagem-visual-unificada) | Exportar código e linguagem visual unificada |

---

## v6 — Árvore de execução

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Decomposição hierárquica da execução em floresta de nós |

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-03 Árvore de execução | [US-16](stories/user-stories.md#us-16--visualizar-árvore-e-responsáveis) | Visualizar árvore e responsáveis |
| EP-03 Árvore de execução | [US-17](stories/user-stories.md#us-17--criar-atividades-e-hierarquia-infinita) | Criar atividades e hierarquia infinita |

---

## Como usar

1. Definir ou ajustar escopo da versão neste arquivo (épico + US).
2. Marcar as US da versão alvo como `ready` em [`stories/user-stories.md`](stories/user-stories.md).
3. Abrir refinamentos em [`tech/refinements/`](tech/refinements/).
4. Ao concluir a entrega, mudar o status da versão para `released` e anotar data se desejado.

Não duplicar o texto das histórias aqui — apenas o **empacotamento por versão**.
