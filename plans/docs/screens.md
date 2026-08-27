# Telas do sistema — Plans

Descrição funcional das telas derivadas das histórias em [`user-stories.md`](user-stories.md) e cenários em [`bdd.md`](bdd.md). Componentes: [`components.md`](components.md).

Personas principais: **organizador**, **condutor de projetos**, **orquestrador**, **modelador de fluxo**, **administrador do projeto**.

---

## Mapa de navegação

```
Plans
├── Visões (componente transversal — acima das telas)
│   ├── Board (kanban + configuração de colunas e raias)
│   ├── Gantt (plano / Gantt)
│   └── Árvore de execução
│
└── Explorar (painel transversal — estilo explorador de IDE)
    ├── Lista em árvore (componente embutido, sempre visível)
    └── Configurações (fixo embaixo)
        └── Catálogo de responsáveis
```

**Transversais:**

- **Visões** — componente transversal **acima do conteúdo das telas**: seletor/navegação entre os tipos Board, Gantt e Árvore; a tela ativa preenche a área abaixo. Não é uma tela em si — US-01.
- **Detalhe da unidade** (drawer/painel) — acessível a partir de Board, Gantt e Árvore; mesma entidade (UUID), vocabulário por visão — US-01, US-02.
- **Explorar** — painel transversal (como o explorador de arquivos de uma IDE): a **lista em árvore não é uma tela**; é um **componente** já visível dentro do Explorar, com drill-down infinito. Persistência como arquivos; **sem** detalhe de arquivo.
- **Configurações** — faixa **fixa embaixo** do Explorar; em v1 o catálogo de responsáveis.

---

## Índice — telas e histórias

| Tela | Histórias contempladas |
|------|------------------------|
| TELA-01 — Board (kanban) | US-01, US-04, US-05, US-06, US-07 |
| TELA-02 — Detalhe da unidade | US-01, US-02 |
| TELA-03 — Plano / Gantt | US-08, US-09, US-10, US-11, US-12, US-13, US-14, US-19 |
| TELA-04 — Árvore de execução | US-15, US-16 |
| TELA-05 — Catálogo de responsáveis | US-03 |
| Visões (transversal, acima das telas) | US-01 |
| Detalhe da unidade (transversal) | US-01, US-02 |
| Explorar (painel transversal + lista em árvore) | US-17, US-18 |
| Configurações (fixo sob Explorar) | US-03 |
| Troca de visão / tipo (transversal) | US-01, US-17 |

---

## TELA-01 — Board (kanban)

- **Personas:** Organizador, condutor de projetos, orquestrador
- **Objetivo:** Registrar, mover e acompanhar cards no fluxo de colunas e raias — incluindo configurar o próprio board e disparar IA em colunas de execução.

### Conteúdo

- **Grade:** colunas (estágios) × raias (swimlanes); cards com título, responsável tipado e status de execução quando aplicável.
- **Colunas de execução** identificadas visualmente.
- **Hierarquia:** indicação de cards pai/filho; mover pai move a subárvore.
- **Estados de IA** no card: `pendente`, `em execução`, `concluída`, `falhou`, `cancelada`.
- **Painel / modo de configuração** (no próprio board): listas ordenáveis de colunas e raias; flag “coluna de execução”; aviso quando remoção está bloqueada por cards.

### Ações

- Criar card com título e contexto opcional no próprio board — US-05.
- Mover card entre qualquer coluna/raia válida (sem WIP em v1).
- Aninhar, desaninhar e mover subárvore — US-06.
- Configurar colunas e raias no board: adicionar, renomear, reordenar; marcar/desmarcar execução; remover só se vazia — US-04, US-07.
- Abrir detalhe da unidade → TELA-02.
- Abrir no Explorar / Gantt / Árvore — US-01, US-17.
- Retry de IA quando status `falhou` — US-07.

### Navegação

- Menu **Board**.
- Configuração de colunas/raias permanece **na mesma tela** (painel, modo ou drawer do board).

---

## TELA-02 — Detalhe da unidade

- **Personas:** Organizador, orquestrador, condutor de projetos
- **Objetivo:** Ver e editar a mesma unidade (UUID) com campos, responsável, contexto, saídas e ciclo de vida.

### Conteúdo

- **Identidade:** UUID, título, vocabulário da visão de origem (card / tarefa / atividade / arquivo).
- **Campos:** título (obrigatório), contexto (opcional).
- **Responsável tipado:** pessoa, IA ou máquina (ou nenhum) — só itens do catálogo.
- **Saídas / artefatos** ligados à unidade (quando existirem).
- **Ciclo de vida:** ativa, arquivada; ações excluir / arquivar / desarquivar.

### Ações

- Editar título e contexto.
- Atribuir, trocar ou remover responsável — US-02.
- Abrir na visão pedida (Board, Gantt, Árvore, Explorar).
- Excluir (global) ou arquivar / desarquivar — US-01.

### Navegação

- Drawer/painel a partir de qualquer visão principal.
- Merge de unidades **não disponível** em v1.

---

## TELA-03 — Plano / Gantt

- **Personas:** Condutor de projetos, modelador de fluxo, orquestrador
- **Objetivo:** Organizar ordens no tempo, modelar FOP, programar máquina e exportar código — tudo na mesma superfície do Gantt.

### Conteúdo

- **Seletor de plano** (incluindo plano padrão do projeto).
- **Eixo temporal** com tarefas posicionadas por início/fim (fuso do projeto); duração derivada.
- **Lista** de tarefas sem datas válidas, sinalizadas (não posicionadas no eixo).
- **Relações** sequenciais (finish-to-start) e paralelas.
- **Hierarquia** de tarefas com roll-up de datas e estado no pai.
- **Status de execução** para tarefas com IA.
- **Área FOP** (no Gantt): artefatos de estado (entradas/saídas), ligações, estruturas (sequência, paralelo, seleção, repetição), camadas, contexto e validação (órfãos / ciclo).
- **Área máquina** (quando responsável = máquina): editor com libs v1 (`stdio`, `fs`, `http`), loops `for`/`while`, feedback e resultado.
- **Área exportação:** status de consistência; FOP-IR; TypeScript / Python; preview e download.

### Ações

- Criar / renomear / excluir planos (exceto apagar tarefas do padrão ao excluir outro plano).
- Criar tarefa (título obrigatório; plano padrão se omitido).
- Definir / alterar datas; rejeitar início > fim.
- Definir, remover ou ajustar relações sequenciais/paralelas — US-09.
- Aninhar / desaninhar tarefas — US-10.
- Executar plano via AIs, cancelar, retry — US-11.
- Definir/ligar/remover artefatos FOP; validar plano — US-12, US-19.
- Programar e executar tarefa máquina — US-13.
- Compilar FOP-IR e exportar TypeScript/Python — US-14.
- Abrir detalhe da unidade → TELA-02.

### Navegação

- Menu **Gantt**.
- FOP, máquina e exportação ficam **na mesma tela** (painéis, abas ou modos do Gantt).
- Troca de visão para Board / Árvore / Explorar na mesma unidade.

---

## TELA-04 — Árvore de execução

- **Personas:** Condutor de projetos
- **Objetivo:** Ver a floresta de atividades, responsáveis e hierarquia infinita fora do eixo temporal.

### Conteúdo

- **Floresta:** múltiplas raízes e nós aninhados.
- **Responsáveis** visíveis por nó.
- **Procedimento** editável quando o responsável é máquina (paridade parcial vs Gantt em v1).
- Estado vazio utilizável quando não há atividades.

### Ações

- Criar atividade raiz ou filha (título obrigatório).
- Desaninhar / reorganizar pais (sem ciclos).
- Excluir atividade (subárvore deixa de aparecer como ativa).
- Atribuir responsável → TELA-02 / US-02.
- Editar procedimento máquina (escopo árvore; detalhe completo no Gantt — TELA-03).
- Abrir no Board / Gantt / Explorar.

### Navegação

- Menu **Árvore**.
- Drill para detalhe da unidade → TELA-02.

---

## TELA-05 — Catálogo de responsáveis

- **Personas:** Administrador do projeto
- **Objetivo:** Controlar quem pode ser atribuído como pessoa, IA ou máquina.

### Conteúdo

- **Abas ou seções** por tipo: pessoas, IAs, máquinas.
- Lista de itens do catálogo; indicação se o item está em uso como responsável.

### Ações

- Incluir item no catálogo.
- Remover item **somente se** não for responsável de nenhuma unidade (ou exigir limpeza antes).
- Ver unidades que usam o item (para desbloqueio de remoção).

### Navegação

- **Fixo embaixo** do painel Explorar (não é visão principal).
- Usado indiretamente por TELA-02 (atribuição).

---

## Componentes transversais

### Visões (acima das telas)

Componente transversal de **navegação entre tipos de visão**, posicionado **acima** da área de conteúdo das telas — US-01.

- Tipos navegáveis: **Board**, **Gantt**, **Árvore de execução**.
- Não é uma tela: é o chrome compartilhado; a tela ativa (TELA-01, TELA-03 ou TELA-04) renderiza **abaixo** do seletor.
- Trocar de tipo mantém o contexto do projeto; quando a ação parte de uma unidade, o UUID permanece o mesmo (ver Troca de visão).

### Detalhe da unidade

Painel/drawer compartilhado (TELA-02) a partir de Board, Gantt e Árvore — US-01, US-02. O Explorar **não** tem detalhe de arquivo.

### Explorar (painel transversal)

Painel sempre presente na navegação, no padrão de um **explorador de IDE** — US-17, US-18.

- A **lista em árvore não é uma tela**: é um **componente embutido** no próprio Explorar, já visível ao usar o sistema.
- Drill-down infinito (expandir/recolher); ordenação por título em cada nível; arquivos arquivados acessíveis.
- Sem detalhe de arquivo nesta superfície; atalhos levam à unidade no Board, Gantt ou Árvore.

### Configurações

**Fixas embaixo** do Explorar. Em v1: catálogo de responsáveis (TELA-05) — US-03.

### Troca de visão

Ações “Abrir no Board / Gantt / Árvore / Explorar” presentes nas telas e no detalhe; a entidade permanece a mesma — US-01, US-17. Complementa o seletor de **Visões** (acima das telas) quando a troca é pedida a partir de uma unidade. “Abrir no Explorar” revela/destaca o arquivo na lista em árvore do painel (não abre outra tela).
