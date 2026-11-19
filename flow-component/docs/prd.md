# PRD — Flow Component

| Campo | Valor |
|---|---|
| Produto | **Flow Component** — lib front-end de interfaces/comandos do Flow IDE |
| Código | `works/flow-component` |
| Status | rascunho v0.2 (2026-11-19) |
| Fonte de inventário | [`flow-dev` visão](../../flow-dev/README.md) · [`flow-dev/docs/prd.md`](../../flow-dev/docs/prd.md) · `Ide` + `contracts.ts` + `FlowView` / Explorer |
| Relacionados | [`flow-language`](../../flow-language/README.md) · [`flow`](../../flow/README.md) |

---

## 1. Definição (o quê)

**Flow Component** é a **biblioteca front-end** com **todas as interfaces necessárias** para cobrir as **funcionalidades do Flow IDE** (Explorar + Flow + catálogo + dado + execução + export): criar/editar/remover funções e composição, I/O, dados, responsáveis/tasks, módulos, estruturas `if`/`for`, paralelismo, mover/colar, rodar e exportar.

Cada capacidade é um **comando** com contrato tipado. O host **opta por operar** (UI, API só, ou desabilitado) sem fork da semântica.

## 2. Problema

Operações do Flow IDE estão embutidas em `flow-dev/app` e no editor Flow Language. Sem superfície reutilizável, cada host reimplementa a semântica.

## 3. Objetivo

1. Interfaces tipadas cobrindo **100% das operações de modelo** do Flow IDE.
2. Comandos invocáveis com efeito documentado (IDR, payload, resultado/erro).
3. Host decide exposição; a lib não depende de um canvas concreto.

## 4. Personas

| Persona | Job |
|---------|-----|
| **Autor do Flow IDE** | Consome a lib no lugar de lógica espalhada em `Ide` / views |
| **Autor de host** | Liga UI própria aos mesmos comandos |
| **Testador** | Invoca operações sem subir o IDE completo |

---

## 5. Inventário de interfaces (cobertura Flow IDE)

Fonte: superfície `Ide` (`flow-dev/app/apps/web/src/features/ide/ide.tsx`), contratos Zod (`packages/shared/src/contracts.ts`), toolbars `FlowView` / Explorer / Dialogs.

### 5.1 Função e composição — *must*

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `createFunction` / `newFlow` | Função raiz (fluxo) | `newFlow`, Explorer “Nova função” |
| `createChild` | Filho sob pai | `addFn(…, "child")` |
| `createSibling` | Irmão (`after` / `before`) | `addFn(…, "after"\|"before")` |
| `renameFunction` | Altera rótulo (IDR fixo) | `renameCommit` / clique no nome |
| `removeElements` | Remove por IDR(s) | `askRemove` / `elements-remove` |
| `duplicate` | Cópia com novos IDRs | `dup` |
| `move` | Reparent / reordenar | `move` · `moveElementBody` |
| `cut` / `copy` / `paste` | Clipboard do grafo | `clip` + `paste` |
| `patchFunction` | title, context, code, archived, ins, outs, loop, cond, agent | `patchEl` · `patchElementBody` |
| `setSelection` (`if`) | Liga/desliga seleção | `setStruct(id, "if", on)` · edge-if |
| `setRepetition` (`loop`) | Liga/desliga `for` | `setStruct(id, "loop", on)` · edge-loop |
| `setParallel` | Liga/desliga paralelo entre nós | `parallelBody` |
| `openFlowRoot` | Define raiz visível do Flow | `setFlowRootFrom` / `openFlowView` |

### 5.2 Entrada / saída — *must*

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `addInput` | Porta de entrada (nome de dado) | `patch` `ins` |
| `removeInput` | Remove entrada | `patch` `ins` |
| `addOutput` | Porta de saída (nome + path) | `patch` `outs` |
| `removeOutput` | Remove saída | `patch` `outs` |
| `setCond` | Condição `if` (test + goto) | `cond` em `patchElementBody` |
| `setLoopVars` | Variável / coleção do `for` | `loop` em `patchElementBody` |

### 5.3 Dados (estado / □ / cubo) — *must*

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `createData` | Novo dado no catálogo | `newDado` |
| `upsertData` | Tipo, valor, módulo | `saveDado` · `upsertDataBody` |
| `addDataChild` | Campo filho (árvore) | `addKid` · `addDataKidBody` |
| `toggleCube` | Folha □ ↔ cubo composto | `toggleCube` |
| `revealData` / `editData` | Foco / painel do dado | `revealDado` / `editDado` |

### 5.4 Responsável · Task · catálogo — *must*

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `assignResponsible` | Liga agente/arquivo/modelo à função | `assign` · `agentId`/`respId` |
| `setTask` | Task/método (select concreto ou verbo) | `renameCommit` + `taskIsConcrete` |
| `createAgent` / `patchAgent` | Catálogo IA · pessoa · lib · script | `createAgentBody` / `patchAgentBody` |
| `createModel` / `patchModel` | Modelo LLM | `createModelBody` / `patchModelBody` |

### 5.5 Arquivos / módulos (Explorar) — *must*

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `createModule` / `renameModule` | Arquivo `.js` no Explorar | `createModuleBody` / `patchModuleBody` |
| `listModules` / itens do módulo | Funções e dados sob arquivo | Explorer + snapshot `modules` |

### 5.6 Execução — *must* (contrato; runtime pode ser adapter do host)

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `runPlan` | Executa plano (lib → Terminal; IA/pessoa → runner) | `runPlan` |
| `cancelRun` | Cancela execução | `cancelRun` |
| `completeStep` | Pessoa conclui etapa | `complete` |
| `retryStep` | Retenta etapa | `retry` |
| `runMachine` | Roda código da etapa máquina | `runMachine` |

### 5.7 Exportação — *must* (contrato de pedido; geradores podem viver noutro pacote)

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `exportPlan` | IR · JS · TS · Py | `openExport` / `exportPlan` |

### 5.8 Seleção e UI de comando — *should* (estado de host, contrato estável)

| Interface | Efeito |
|-----------|--------|
| `select` / multi-select | Seleção por IDR |
| `openDrawer` / fechar painéis | Editar detalhe |
| `toggleKids` / abrir·fechar todos filhos | Sanfona Flow |
| `toggleIndent` | Indentação coluna Task |
| `toggleTerminal` / `termLog` / `clearTerm` | Terminal |

### 5.9 Fora da lib (host / plataforma)

Auth, CRUD de projeto SaaS, tema visual, pan/zoom puro de viewport, toast, persistência HTTP — o host implementa; a lib não os exige. A lib **não** substitui Board/Gantt/Copiloto (fora do Flow IDE).

---

## 6. Lacunas vs rascunho v0.1

O v0.1 listava só **5** criações. Para cobrir o Flow IDE, **faltam** (ainda não no escopo must anterior):

### Crítico (modelo / edição)

- Renomear · remover · duplicar · mover · cut/copy/paste
- `patchFunction` (context, code, archived)
- Seleção `if` / repetição `for` (toggle + edge) · paralelo
- Remover entrada/saída · `setCond` · `setLoopVars`
- Dados: criar, upsert (tipo/valor), filho, toggle cubo, reveal/edit
- Atribuir responsável · set task
- CRUD agente / modelo
- Módulos / arquivo no Explorar
- `newFlow` (raiz) além de “criar função” genérico
- Abrir raiz do Flow (`flowRoot`)

### Execução e export

- `runPlan` · `cancelRun` · `completeStep` · `retryStep` · `runMachine`
- `exportPlan` (IR/JS/TS/Py)

### UI opcional (should)

- select / drawer / sanfona filhos / indent / terminal

### Já coberto no v0.1

- Criar função · criar entrada · criar saída · criar filho · criar irmão

### Contradição corrigida

v0.1 punha Explorar, responsáveis, export e runtime em **não-objetivos**. Isso **impedia** cobrir o Flow IDE. v0.2: essas operações entram como **interfaces must**; só chrome de plataforma fica fora.

---

## 7. Superfície de comando — *must*

- Nome estável, payload, resultado (sucesso / erro tipado).
- Referência por **IDR** (nome = rótulo).
- Host pode expor, chamar só via API ou desabilitar sem remover o contrato.
- Sem side-effect fora do modelo/adapters acordados.

## 8. Empacotamento — *should*

- ESM + tipos TypeScript públicos.
- Zero dependência obrigatória de um canvas.
- Adapters: `ModelStore` (snapshot), `Runner`, `Exporter` injetáveis pelo host.

## 9. Critérios de sucesso

1. Toda operação da tabela §5.1–5.7 tem interface na lib.
2. Flow IDE (ou spike) consegue substituir as mutações de `Ide` pelos comandos da lib sem reimplementar semântica.
3. Desabilitar comando na UI não remove o contrato.
4. Dois hosts consomem o mesmo pacote sem fork.

## 10. Relação

```text
FOP → Flow Language
         ↓
    Flow Component  ←── interfaces = superfície do Flow IDE
         ↑
    Flow.dev / outros hosts
```

## 11. Antes → depois

| Antes | Depois |
|-------|--------|
| 5 operações de criação | Inventário completo alinhado ao Flow IDE |
| Explorar / agentes / run / export fora | Interfaces must; chrome fica no host |
| Semântica só em `Ide` | Contrato reutilizável na lib |

**Voltar:** escopo v0.1 (só as 5 criações).

## 12. Próximos passos

1. Fechar TypeScript das interfaces §5.1–5.3 (primeiro lote).
2. Espelhar nomes estáveis aos contratos Zod existentes.
3. Spike: `flow-dev` `addFn` / `setStruct` / `saveDado` → comandos da lib.
4. Lotes seguintes: §5.4–5.7.
