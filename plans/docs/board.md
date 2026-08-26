# Board — Controle de atividades

Kanban das user stories. **Status e versão vivem só aqui** — não em [`epics.md`](epics.md) nem em [`stories/user-stories.md`](stories/user-stories.md).

Colunas: `draft` → `ready` → `in-progress` → `done`.  
Quando `ready`: breakdown em [`tech/refinements/`](tech/refinements/).

Negócio: [`../README.md`](../README.md) · Épicos: [`epics.md`](epics.md) · Histórias: [`stories/user-stories.md`](stories/user-stories.md)

## Versões

| Versão | Nome | Status |
|--------|------|--------|
| v1 | Núcleo | in-progress |
| v2 | Hierarquia e Explorar | planned |
| v3 | IA e prestadores no Board | planned |
| v4 | Gantt básico | planned |
| v5 | Gantt avançado | planned |
| v6 | Árvore de execução | planned |

**v1 ordem sugerida:** US-01 → US-03 → US-02 → US-04 → US-05 → US-18.

## Como mover

1. Nova história → coluna **Draft** (épico, persona e versão preenchidos).
2. Aceite testável e DoR ok → **Ready**.
3. Implementação iniciada → **In progress**.
4. Aceite validado → **Done**.

---

## Done

| ID | Título | Épico | Persona | Versão |
|----|--------|-------|---------|--------|
| [US-01](stories/user-stories.md) | Mesma unidade, vocabulário e ciclo de vida | EP-00 | usuário | v1 |

## In progress

_Nenhuma._

## Ready

| ID | Título | Épico | Persona | Versão |
|----|--------|-------|---------|--------|
| [US-02](stories/user-stories.md) | Atribuir responsável tipado | EP-00 | usuário | v1 |
| [US-03](stories/user-stories.md) | Gerenciar catálogo de responsáveis | EP-00 | administrador do projeto | v1 |
| [US-04](stories/user-stories.md) | Configurar colunas e raias | EP-01 | membro do time | v1 |
| [US-05](stories/user-stories.md) | Cadastrar e mover cards | EP-01 | usuário | v1 |
| [US-18](stories/user-stories.md) | Persistir e abrir no Explorar | EP-04 | usuário | v1 |

## Draft

| ID | Título | Épico | Persona | Versão |
|----|--------|-------|---------|--------|
| [US-06](stories/user-stories.md) | Aninhar e mover hierarquia de cards | EP-01 | usuário | v2 |
| [US-19](stories/user-stories.md) | Lista, busca e navegação por profundidade | EP-04 | usuário | v2 |
| [US-07](stories/user-stories.md) | Colunas de execução e orquestração de IA | EP-01 | usuário | v3 |
| [US-08](stories/user-stories.md) | Chamado e prestador de serviço | EP-01 | usuário final / prestador de serviço | v3 |
| [US-09](stories/user-stories.md) | Planos, ordens e datas | EP-02 | usuário | v4 |
| [US-10](stories/user-stories.md) | Tarefas sequenciais e paralelas | EP-02 | usuário | v4 |
| [US-11](stories/user-stories.md) | Aninhar tarefas e roll-up | EP-02 | usuário | v4 |
| [US-12](stories/user-stories.md) | Execução de planos via AIs | EP-02 | usuário | v5 |
| [US-13](stories/user-stories.md) | Flow Oriented Programming | EP-02 | usuário | v5 |
| [US-14](stories/user-stories.md) | Máquina como linguagem no Gantt | EP-02 | usuário | v5 |
| [US-15](stories/user-stories.md) | Exportar código e linguagem visual unificada | EP-02 | usuário | v5 |
| [US-16](stories/user-stories.md) | Visualizar árvore e responsáveis | EP-03 | usuário | v6 |
| [US-17](stories/user-stories.md) | Criar atividades e hierarquia infinita | EP-03 | usuário | v6 |
