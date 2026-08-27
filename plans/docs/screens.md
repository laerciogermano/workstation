# Telas do sistema — Plans

Descrição funcional das telas derivadas das histórias em [`user-stories.md`](user-stories.md) e cenários em [`bdd.md`](bdd.md). Componentes: [`components.md`](components.md).

Personas principais: **organizador**, **condutor de projetos**, **orquestrador**, **modelador de fluxo**, **administrador do projeto**.

---

## Mapa de navegação

```
Plans
├── Board
│   ├── Board (kanban)
│   └── Configuração de colunas e raias
├── Gantt
│   ├── Plano / Gantt
│   ├── Editor FOP (estado e procedimentos)
│   ├── Editor máquina
│   └── Exportar código (FOP-IR)
├── Árvore de execução
│   └── Floresta de atividades
├── Explorar
│   ├── Lista, busca e drill-down
│   └── Detalhe do arquivo
├── Atividades
│   ├── Registrar atividade
│   ├── Pesquisa assistida (comparativo)
│   └── Registrar decisão
└── Configurações
    └── Catálogo de responsáveis
```

**Componente transversal:** detalhe da unidade de trabalho (drawer/painel) acessível a partir de Board, Gantt, Árvore e Explorar — mesma entidade (UUID), vocabulário por visão — US-01, US-02.

---

## Índice — telas e histórias

| Tela | Histórias contempladas |
|------|------------------------|
| TELA-01 — Board (kanban) | US-01, US-05, US-06, US-07 |
| TELA-02 — Configuração de colunas e raias | US-04 |
| TELA-03 — Detalhe da unidade | US-01, US-02, US-19, US-20, US-21 |
| TELA-04 — Plano / Gantt | US-08, US-09, US-10, US-11 |
| TELA-05 — Editor FOP | US-12, US-22 |
| TELA-06 — Editor máquina | US-13, US-22 |
| TELA-07 — Exportar código | US-14 |
| TELA-08 — Árvore de execução | US-15, US-16 |
| TELA-09 — Explorar (lista e navegação) | US-17, US-18 |
| TELA-10 — Detalhe do arquivo no Explorar | US-01, US-17 |
| TELA-11 — Registrar atividade | US-19 |
| TELA-12 — Pesquisa assistida (comparativo) | US-20 |
| TELA-13 — Registrar decisão | US-21 |
| TELA-14 — Catálogo de responsáveis | US-03 |
| Detalhe da unidade (transversal) | US-01, US-02 |
| Troca de visão (transversal) | US-01, US-17 |

---

## TELA-01 — Board (kanban)

- **Personas:** Organizador, condutor de projetos, orquestrador
- **Objetivo:** Registrar, mover e acompanhar cards no fluxo de colunas e raias, incluindo disparo de IA em colunas de execução.

### Conteúdo

- **Grade:** colunas (estágios) × raias (swimlanes); cards com título, responsável tipado e status de execução quando aplicável.
- **Colunas de execução** identificadas visualmente.
- **Hierarquia:** indicação de cards pai/filho; mover pai move a subárvore.
- **Estados de IA** no card: `pendente`, `em execução`, `concluída`, `falhou`, `cancelada`.

### Ações

- Criar card com título (contexto opcional via TELA-03 / TELA-11).
- Mover card entre qualquer coluna/raia válida (sem WIP em v1).
- Aninhar, desaninhar e mover subárvore — US-06.
- Abrir detalhe da unidade → TELA-03.
- Abrir no Explorar / Gantt / Árvore — US-01, US-17.
- Retry de IA quando status `falhou` — US-07.

### Navegação

- Menu **Board**.
- Atalho para configuração de colunas/raias → TELA-02.

---

## TELA-02 — Configuração de colunas e raias

- **Personas:** Condutor de projetos
- **Objetivo:** Adequar o board ao processo do time (quantidade livre de colunas e raias).

### Conteúdo

- **Lista ordenável** de colunas (nome, ordem, flag “coluna de execução”).
- **Lista ordenável** de raias (nome, ordem).
- **Aviso** quando remoção está bloqueada por cards presentes.

### Ações

- Adicionar, renomear, reordenar colunas e raias.
- Marcar / desmarcar coluna de execução — US-07.
- Remover coluna/raia **somente se vazia** — US-04.
- Salvar configuração e voltar ao Board.

### Navegação

- Acessível a partir do Board (TELA-01).
- Retorno ao Board após salvar ou cancelar.

---

## TELA-03 — Detalhe da unidade

- **Personas:** Organizador, orquestrador, condutor de projetos
- **Objetivo:** Ver e editar a mesma unidade (UUID) com campos, responsável, contexto, saídas e ciclo de vida.

### Conteúdo

- **Identidade:** UUID, título, vocabulário da visão de origem (card / tarefa / atividade / arquivo).
- **Campos:** título (obrigatório), contexto (opcional).
- **Responsável tipado:** pessoa, IA ou máquina (ou nenhum) — só itens do catálogo.
- **Saídas / artefatos** ligados (ex.: comparativo de pesquisa).
- **Decisão** registrada, se houver.
- **Ciclo de vida:** ativa, arquivada; ações excluir / arquivar / desarquivar.

### Ações

- Editar título e contexto.
- Atribuir, trocar ou remover responsável — US-02.
- Solicitar pesquisa assistida (se responsável IA) → TELA-12.
- Registrar / alterar decisão → TELA-13.
- Abrir na visão pedida (Board, Gantt, Árvore, Explorar).
- Excluir (global) ou arquivar / desarquivar — US-01.

### Navegação

- Drawer/painel a partir de qualquer visão principal.
- Merge de unidades **não disponível** em v1.

---

## TELA-04 — Plano / Gantt

- **Personas:** Condutor de projetos, modelador de fluxo, orquestrador
- **Objetivo:** Organizar ordens no tempo, dependências, hierarquia com roll-up e execução via AIs.

### Conteúdo

- **Seletor de plano** (incluindo plano padrão do projeto).
- **Eixo temporal** com tarefas posicionadas por início/fim (fuso do projeto); duração derivada.
- **Lista** de tarefas sem datas válidas, sinalizadas (não posicionadas no eixo).
- **Relações** sequenciais (finish-to-start) e paralelas.
- **Hierarquia** de tarefas com roll-up de datas e estado no pai.
- **Status de execução** para tarefas com IA.

### Ações

- Criar / renomear / excluir planos (exceto apagar tarefas do padrão ao excluir outro plano).
- Criar tarefa (título obrigatório; plano padrão se omitido).
- Definir / alterar datas; rejeitar início > fim.
- Definir, remover ou ajustar relações sequenciais/paralelas — US-09.
- Aninhar / desaninhar tarefas — US-10.
- Executar plano via AIs, cancelar, retry — US-11.
- Abrir Editor FOP → TELA-05; Editor máquina → TELA-06; Exportar → TELA-07.
- Abrir detalhe da unidade → TELA-03.

### Navegação

- Menu **Gantt**.
- Troca de visão para Board / Árvore / Explorar na mesma unidade.

---

## TELA-05 — Editor FOP

- **Personas:** Modelador de fluxo
- **Objetivo:** Modelar o roteiro como estado (entradas/saídas) + procedimentos, com validação para exportação.

### Conteúdo

- **Canvas / lista do fluxo** do plano selecionado.
- **Artefatos de estado:** entradas e saídas (nome + referência) por tarefa/procedimento.
- **Ligações** saída → entrada evidentes no fluxo.
- **Estruturas:** sequência, paralelo, seleção (condicional), repetição — US-22.
- **Camadas** e indicação de **contexto** completo/incompleto.
- **Validação:** avisos (órfãos) e bloqueios (ciclo de estado).

### Ações

- Definir, editar e remover entradas/saídas.
- Ligar / desligar artefatos entre tarefas.
- Compor seleção e repetição no roteiro.
- Validar plano (aviso órfãos; bloqueio ciclo).
- Ir para Exportar → TELA-07 quando consistente.

### Navegação

- Acessível a partir do Plano / Gantt (TELA-04).
- Retorno ao Gantt mantendo o plano selecionado.

---

## TELA-06 — Editor máquina

- **Personas:** Modelador de fluxo
- **Objetivo:** Programar e executar tarefa com responsável máquina como linguagem no Gantt.

### Conteúdo

- **Editor** da tarefa máquina: bibliotecas v1 (`stdio`, `fs`, `http`), loops `for` / `while`, estados entrada/saída.
- **Feedback** de sintaxe / libs fora do conjunto v1.
- **Resultado da execução:** saídas atualizadas e status de conclusão.

### Ações

- Editar e salvar programa (rejeitar inválido ou fora de v1).
- Executar tarefa máquina.
- Associar/atualizar entradas e saídas do procedimento.
- Voltar ao Gantt ou Detalhe da unidade.

### Navegação

- Disponível apenas quando o responsável da tarefa é **máquina**.
- Entrada pelo Gantt (TELA-04) ou Árvore (procedimento — TELA-08).

---

## TELA-07 — Exportar código

- **Personas:** Modelador de fluxo
- **Objetivo:** Compilar o plano em FOP-IR e exportar TypeScript ou Python.

### Conteúdo

- **Plano selecionado** e status de consistência (ciclo bloqueia; órfãos avisam).
- **Opções:** gerar FOP-IR; exportar TypeScript; exportar Python; exportar direto (equivalente via IR).
- **Avisos e erros** da validação/exportação.
- **Pré-visualização** ou download do artefato gerado.

### Ações

- Compilar FOP-IR.
- Exportar para TypeScript ou Python.
- Rejeitar destinos não suportados em v1.
- Baixar / copiar artefato quando a operação completa.

### Navegação

- Acessível a partir do Gantt (TELA-04) e do Editor FOP (TELA-05).

---

## TELA-08 — Árvore de execução

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
- Atribuir responsável → TELA-03 / US-02.
- Editar procedimento máquina → alinhado a TELA-06 (escopo árvore).
- Abrir no Board / Gantt / Explorar.

### Navegação

- Menu **Árvore**.
- Drill para detalhe da unidade → TELA-03.

---

## TELA-09 — Explorar (lista e navegação)

- **Personas:** Organizador, condutor de projetos
- **Objetivo:** Percorrer unidades persistidas como arquivos, com busca e profundidade.

### Conteúdo

- **Lista** ordenada por **título**.
- **Busca** por título; estado vazio claro quando não há resultados.
- **Drill-down** na hierarquia e **breadcrumb** do caminho.
- Indicação de unidades arquivadas ainda acessíveis.

### Ações

- Buscar e filtrar por título.
- Entrar/sair de níveis; saltar via breadcrumb.
- Abrir detalhe do arquivo → TELA-10.
- Abrir a mesma unidade no Board, Gantt ou Árvore — US-17.

### Navegação

- Menu **Explorar**.
- Lista vazia permanece utilizável (criar / voltar).

---

## TELA-10 — Detalhe do arquivo no Explorar

- **Personas:** Organizador
- **Objetivo:** Consultar a unidade persistida como arquivo e espelhar o ciclo de vida.

### Conteúdo

- Mesmos campos canônicos da TELA-03 (UUID, título, contexto, responsável, saídas, decisão).
- Metadados de persistência / arquivamento.
- Atalhos para as outras visões da mesma unidade.

### Ações

- Editar campos permitidos (reflete em todas as visões).
- Desarquivar se arquivada.
- Abrir no Board / Gantt / Árvore.

### Navegação

- A partir da lista do Explorar (TELA-09).
- Equivalente visual ao detalhe transversal, rotulado como **arquivo**.

---

## TELA-11 — Registrar atividade

- **Personas:** Organizador
- **Objetivo:** Capturar intenção com título e contexto opcional sem trocar de ferramenta.

### Conteúdo

- **Formulário:** título (obrigatório), contexto (opcional — orçamento, preferências, restrições).
- **Pré-visualização** de onde a atividade aparecerá (Board / outras visões).

### Ações

- Salvar atividade (rejeitar sem título).
- Opcional: atribuir responsável IA e seguir para pesquisa — TELA-12.
- Ir ao Board ou Detalhe após criar.

### Navegação

- Ação rápida global (“Nova atividade”) ou a partir do Board.
- Exemplos de uso alinhados à visão (*Comprar fone…*).

---

## TELA-12 — Pesquisa assistida (comparativo)

- **Personas:** Organizador, orquestrador
- **Objetivo:** Obter comparativo estruturado gerado por IA ligado à mesma unidade.

### Conteúdo

- **Contexto da solicitação:** título e contexto da atividade; IA responsável.
- **Status** da pesquisa (`em execução`, `concluída`, `falhou`).
- **Comparativo estruturado:** opções, benefícios, faixas de preço; fontes quando disponíveis.
- Saída persistida como artefato da unidade (visível no Board e Explorar).

### Ações

- Solicitar pesquisa (somente com responsável IA).
- Retry se `falhou`.
- Seguir para registrar decisão → TELA-13.
- Abrir detalhe da unidade → TELA-03.

### Navegação

- A partir do Detalhe (TELA-03) ou após Registrar atividade (TELA-11).

---

## TELA-13 — Registrar decisão

- **Personas:** Organizador
- **Objetivo:** Documentar a opção escolhida e encerrar a etapa de decisão.

### Conteúdo

- **Resumo:** título, contexto, comparativo (se houver).
- **Formulário:** opção escolhida + observação opcional.
- Histórico da decisão atual (substitui a anterior ao salvar).

### Ações

- Salvar decisão (manual válida mesmo sem pesquisa prévia).
- Alterar decisão antes de concluir.
- Arquivar unidade mantendo decisão e comparativo no Explorar.

### Navegação

- A partir do Detalhe ou após Pesquisa assistida.
- Retorno ao Board / Explorar.

---

## TELA-14 — Catálogo de responsáveis

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

- Menu **Configurações**.
- Usado indiretamente por TELA-03 (atribuição).

---

## Componentes transversais

### Detalhe da unidade

Painel/drawer compartilhado (TELA-03) que garante **uma unidade / um UUID** ao trocar de Board, Gantt, Árvore ou Explorar — US-01, US-02.

### Troca de visão

Ações “Abrir no Board / Gantt / Árvore / Explorar” presentes nas telas principais; a entidade permanece a mesma — US-01, US-17.
