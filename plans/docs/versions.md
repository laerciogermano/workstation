# Gerenciador de versões — Plans

Planejamento de **entregas** do produto: quais épicos e histórias entram em cada versão.

Fonte de negócio: [`../README.md`](../README.md) · Épicos: [`epics.md`](epics.md) · Histórias: [`stories/user-stories.md`](stories/user-stories.md) · Técnico: [`tech/README.md`](tech/README.md)

```text
Negócio → Épicos → Histórias → Versões (este arquivo) → Refinamento → Implementação
```

Status da versão: `planned` → `in-progress` → `released`.

> Links apontam só para **arquivos** (sem `#âncora`). No editor do Cursor, fragmento `#…` é tratado como nome de arquivo e gera “file was not found”.

---

## Mapa rápido

### v1 — Núcleo (`in-progress`)

- Unidade única com UUID, vocabulário por visão, excluir/arquivar
- Catálogo de pessoas, IAs, prestadores e máquinas
- Atribuir, trocar e remover responsável tipado
- Board com colunas/raias configuráveis
- Cadastrar e mover cards
- Persistir unidade como arquivo e abrir no Explorar

### v2 — Hierarquia e Explorar (`planned`)

- Aninhar/desaninhar cards e mover subárvore no board
- Lista ordenada, busca e navegação por profundidade (breadcrumb) no Explorar

### v3 — IA e prestadores no Board (`planned`)

- Colunas de execução e orquestração de IA (estados, retry)
- Chamados com prestadores (assumir, concluir, aceite/rejeição, transferência)

### v4 — Gantt básico (`planned`)

- Planos, tarefas/ordens e datas no Gantt
- Tarefas sequenciais (finish-to-start) e paralelas
- Aninhar tarefas e roll-up de datas/estado

### v5 — Gantt avançado (`planned`)

- Execução de planos via AIs (parcial, cancelar, retry)
- Flow Oriented Programming (entradas/saídas, ligações)
- Máquina como linguagem (bibliotecas e loops v1)
- Compilar FOP-IR e exportar para TypeScript/Python

### v6 — Árvore de execução (`planned`)

- Visualizar floresta de atividades e responsáveis
- Criar raiz/filhas, desaninhar e hierarquia infinita

---

## v1 — Núcleo

| Campo | Valor |
|-------|-------|
| Status | in-progress |
| Objetivo | Identidade da unidade, catálogo/responsáveis, board básico e persistência |

Histórias: [`stories/user-stories.md`](stories/user-stories.md)

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-00 Fundamentos | US-01 | Mesma unidade, vocabulário e ciclo de vida |
| EP-00 Fundamentos | US-02 | Atribuir responsável tipado |
| EP-00 Fundamentos | US-03 | Gerenciar catálogo de responsáveis |
| EP-01 Board | US-04 | Configurar colunas e raias |
| EP-01 Board | US-05 | Cadastrar e mover cards |
| EP-04 Explorar | US-18 | Persistir e abrir no Explorar |

**Ordem sugerida:** US-01 → US-03 → US-02 → US-04 → US-05 → US-18.

**Dependências:** US-03 antes de US-02; US-01 antes de US-18; US-04 antes de US-05.

**DoR:** US-01, US-02, US-03, US-04, US-05 e US-18 com status `ready` em [`epics.md`](epics.md).

**Próximo passo:** implementação validada contra os BDD das US v1 (refinamentos em [`tech/refinements/`](tech/refinements/)).

---

## v2 — Hierarquia e Explorar

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Hierarquia infinita no board e navegação rica no Explorar |

Histórias: [`stories/user-stories.md`](stories/user-stories.md)

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-01 Board | US-06 | Aninhar e mover hierarquia de cards |
| EP-04 Explorar | US-19 | Lista, busca e navegação por profundidade |

---

## v3 — IA e prestadores no Board

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Orquestração de IA e chamados com prestadores |

Histórias: [`stories/user-stories.md`](stories/user-stories.md)

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-01 Board | US-07 | Colunas de execução e orquestração de IA |
| EP-01 Board | US-08 | Chamado e prestador de serviço |

---

## v4 — Gantt básico

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Planejamento temporal com planos, dependências e aninhamento |

Histórias: [`stories/user-stories.md`](stories/user-stories.md)

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-02 Gantt | US-09 | Planos, ordens e datas |
| EP-02 Gantt | US-10 | Tarefas sequenciais e paralelas |
| EP-02 Gantt | US-11 | Aninhar tarefas e roll-up |

---

## v5 — Gantt avançado

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Execução via AIs, FOP, máquina como linguagem e exportação |

Histórias: [`stories/user-stories.md`](stories/user-stories.md)

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-02 Gantt | US-12 | Execução de planos via AIs |
| EP-02 Gantt | US-13 | Flow Oriented Programming |
| EP-02 Gantt | US-14 | Máquina como linguagem no Gantt |
| EP-02 Gantt | US-15 | Exportar código e linguagem visual unificada |

---

## v6 — Árvore de execução

| Campo | Valor |
|-------|-------|
| Status | planned |
| Objetivo | Decomposição hierárquica da execução em floresta de nós |

Histórias: [`stories/user-stories.md`](stories/user-stories.md)

### Por épico

| Épico | ID | História |
|-------|-----|----------|
| EP-03 Árvore de execução | US-16 | Visualizar árvore e responsáveis |
| EP-03 Árvore de execução | US-17 | Criar atividades e hierarquia infinita |

---

## Como usar

1. Definir ou ajustar escopo da versão neste arquivo (épico + US).
2. Marcar as US da versão alvo como `ready` em [`epics.md`](epics.md).
3. Abrir refinamentos em [`tech/refinements/README.md`](tech/refinements/README.md).
4. Ao concluir a entrega, mudar o status da versão para `released` e anotar data se desejado.

Não duplicar o texto das histórias aqui — apenas o **empacotamento por versão**.
