# Épicos — Plans

Épicos e **rastreio das histórias** (status, persona). O texto das US fica em [`stories/user-stories.md`](stories/user-stories.md).

Negócio: [`../README.md`](../README.md) · Versões: [`versions.md`](versions.md) · Técnico: [`tech/`](tech/)

Status: `draft` → `ready` → `in-progress` → `done`. Quando `ready`: breakdown em [`tech/refinements/`](tech/refinements/).

| ID | Épico | Histórias |
|----|-------|-----------|
| EP-00 | Fundamentos | US-01 … US-03 |
| EP-01 | Board | US-04 … US-08 |
| EP-02 | Gantt | US-09 … US-15 |
| EP-03 | Árvore de execução | US-16 … US-17 |
| EP-04 | Explorar | US-18 … US-19 |

---

## EP-00 — Fundamentos

- Representar toda atividade como a **mesma unidade de trabalho** (card / tarefa / nó / arquivo)
- Nomear a unidade conforme a **visão** (vocabulário por superfície)
- Atribuir responsáveis: **pessoa**, **IA**, **prestador de serviço**, **máquina**
- Quando o responsável for **máquina**, tratar a unidade como **linguagem de programação**
- Catálogo de responsáveis do projeto

### Histórias

| ID | Título | Status | Persona |
|----|--------|--------|----------|
| [US-01](stories/user-stories.md) | Mesma unidade, vocabulário e ciclo de vida | ready | usuário |
| [US-02](stories/user-stories.md) | Atribuir responsável tipado | ready | usuário |
| [US-03](stories/user-stories.md) | Gerenciar catálogo de responsáveis | ready | administrador do projeto |

---

## EP-01 — Board

- Configurar **colunas** e **raias (swimlanes)** com quantidade livre
- **Cadastrar**, **atribuir**, **mover** e **aninhar** cards (**hierarquia infinita**)
- Marcar **colunas de execução** e **orquestrar AIs**
- Criar **chamado** e orquestrar **prestadores de serviços**

### Histórias

| ID | Título | Status | Persona |
|----|--------|--------|----------|
| [US-04](stories/user-stories.md) | Configurar colunas e raias | ready | membro do time |
| [US-05](stories/user-stories.md) | Cadastrar e mover cards | ready | usuário |
| [US-06](stories/user-stories.md) | Aninhar e mover hierarquia de cards | draft | usuário |
| [US-07](stories/user-stories.md) | Colunas de execução e orquestração de IA | draft | usuário |
| [US-08](stories/user-stories.md) | Chamado e prestador de serviço | draft | usuário final / prestador de serviço |

---

## EP-02 — Gantt

- Visualizar **ordens** no tempo, **entradas/saídas** e **responsáveis**
- Tarefas **sequenciais**, **paralelas** e **aninhadas** (hierarquia infinita)
- **Criar planos** e **executar via AIs**
- Aplicar **Flow Oriented Programming**; responsável **máquina** como linguagem
- **Exportar como código** e **linguagem visual unificada**

### Histórias

| ID | Título | Status | Persona |
|----|--------|--------|----------|
| [US-09](stories/user-stories.md) | Planos, ordens e datas | draft | usuário |
| [US-10](stories/user-stories.md) | Tarefas sequenciais e paralelas | draft | usuário |
| [US-11](stories/user-stories.md) | Aninhar tarefas e roll-up | draft | usuário |
| [US-12](stories/user-stories.md) | Execução de planos via AIs | draft | usuário |
| [US-13](stories/user-stories.md) | Flow Oriented Programming | draft | usuário |
| [US-14](stories/user-stories.md) | Máquina como linguagem no Gantt | draft | usuário |
| [US-15](stories/user-stories.md) | Exportar código e linguagem visual unificada | draft | usuário |

---

## EP-03 — Árvore de execução

- Visualizar **atividades (nós)** em árvore
- **Criar atividades filhas** e **hierarquia infinita**
- Atribuir/visualizar **responsáveis**; **máquina** como linguagem

### Histórias

| ID | Título | Status | Persona |
|----|--------|--------|----------|
| [US-16](stories/user-stories.md) | Visualizar árvore e responsáveis | draft | usuário |
| [US-17](stories/user-stories.md) | Criar atividades e hierarquia infinita | draft | usuário |

---

## EP-04 — Explorar

- Persistir toda unidade como **arquivo**
- **Explorador em lista** com **navegação por profundidade**

### Histórias

| ID | Título | Status | Persona |
|----|--------|--------|----------|
| [US-18](stories/user-stories.md) | Persistir e abrir no Explorar | ready | usuário |
| [US-19](stories/user-stories.md) | Lista, busca e navegação por profundidade | draft | usuário |

