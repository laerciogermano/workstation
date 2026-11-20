# PRD — Flow Component

| Campo | Valor |
|---|---|
| Produto | **Flow Component** — lib front-end de interfaces/comandos do Flow IDE |
| Código | `works/flow-component` |
| Status | rascunho v0.3 (2026-11-19) |
| Fonte de inventário | [`flow-dev` visão](../../flow-dev/README.md) · [`flow-dev/docs/prd.md`](../../flow-dev/docs/prd.md) · `Ide` + `contracts.ts` + FlowView / Explorer / proto · auditoria de capacidades 2026-11-19 |
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
| `createSibling` | Irmão (`after` / `before`) | `addFn` · ctx `fn-before` |
| `renameFunction` | Altera rótulo (IDR fixo; regra verbo se abstrato) | `renameCommit` |
| `removeElements` | Remove por IDR(s) (+ confirm c/ filhos) | `askRemove` / `elements-remove` |
| `duplicate` | Cópia com novos IDRs | `dup` |
| `archive` / `unarchive` | Arquiva elemento | `patch` `archived` · Drawer |
| `move` | Reparent / reordenar | `move` · API; UI via cut/paste |
| `cut` / `copy` / `paste` | Clipboard do grafo | `clip` + `paste` |
| `patchFunction` | title, context, code, ins, outs, loop, cond, agent | `patchEl` · `patchElementBody` |
| `setSelection` (`if`) | Liga/desliga seleção | `setStruct` · edge-if · `rm-if` |
| `setRepetition` (`loop`) | Liga/desliga `for` | `setStruct` · edge-loop · `rm-loop` |
| `setParallel` | Liga/desliga paralelo | `POST /parallel` (**API sem botão** no app) |
| `openFlowRoot` | Raiz visível do Flow | `setFlowRootFrom` / `openFlowView` |
| `openInFlow` / `revealInExplorer` | Navegar entre vistas | ContextMenu / Drawer |
| `copyIdr` / `copyPath` | Clipboard de identidade/caminho | Drawer / ContextMenu |

### 5.2 Entrada / saída — *must* (contrato; UI atual é parcial)

**Nota (auditoria):** não há botão “criar entrada/saída” no proto/app. I/O é propriedade `ins`/`outs` do elemento + catálogo de **dados**. A lib **expõe** mutações de porta; o host decide a UI.

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `addInput` / `removeInput` | Mutar `ins` | `patchElementBody.ins` (**sem form dedicado**) |
| `addOutput` / `removeOutput` | Mutar `outs` | `patchElementBody.outs` (**sem form dedicado**) |
| `setCond` | Condição `if` (test + goto) | `cond` no patch |
| `setLoopVars` | Variável / coleção do `for` | `loop` no patch |
| listar I/O (leitura) | Drawer “Estado (entradas e saídas)” | Drawer read-only |

### 5.3 Dados (estado / □ / cubo) — *must*

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `createData` | Novo dado no catálogo | `newDado` |
| `upsertData` | Tipo, valor, módulo | `saveDado` · `upsertDataBody` |
| `clearDataValue` | Valor vazio → abstrato | proto `dado-clear` / painel |
| `addDataChild` | Campo filho (árvore) | `addKid` |
| `toggleCube` | Folha □ ↔ cubo | `toggleCube` |
| `revealData` / `editData` | Foco / painel | `revealDado` / `editDado` |

**Origem de uma entrada (editor do marcador):** além do valor literal, a entrada pode ligar-se a (1) um **estado do contexto** (`ref` / chip) ou (2) um **import de dado de outro arquivo** — outs das funções de 1ª ordem daquele `.ts`. Encoding em `args[name]`: `from:utils.ts#r`. Codegen: `import { helper } from "./utils.ts"` + `const { r } = await helper({})`. **Reverter:** no select Type/origin escolher de novo text/number/… (ou limpar o valor) e Save — some o `from:…` do `args`.

**Quadrado vs cubo (alinhado ao TS):** `ins`/`outs` `[]` → cubo (state/`{}`); um nome → quadrado; 2+ → cubo. O código gerado sempre troca `state`, então o vazio também é caixa. **Antes:** `[]` sem marca + fantasma `+`. **Voltar:** `isCube = length > 1` e fantasmas em `ioMarks`.

**Um parâmetro por função:** a entrada é um só dado (puro) ou um objeto (campos via type object / Add child). Em lib com 1 entrada, o nome é a referência no flow (`renameData` side `in`: ex. `text` → `input`); ao escolher um estado no Type/origin o nome acompanha. Lib void (`outs: []` no contrato, ex. `log`) **não** mostra marca/rótulo de saída. **Antes:** nome fixo; void ganhava `output_*` cubo.

**Catch / else (layout):** mesma regra em `placeAlt` — sequência no passo seguinte ao último do try/if; o próximo só depois do ramo. **Antes:** em paralelo à última célula. **Voltar:** `cs = max(step, next - count)` no layout.

### 5.4 Responsável · Task · catálogo — *must*

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `assignResponsible` / clear | Liga ou limpa responsável | `assign` · picker null |
| `setTask` | Select concreto (lib/arquivo) ou verbo livre | `taskIsConcrete` |
| `createAgent` / `patchAgent` / `removeAgent` | Catálogo (bloqueio se em uso) | AgentPanel / `cat-rm` |
| `createModel` / `patchModel` / `removeModel` | Modelo LLM | ModelPanel |
| `createPerson` | Pessoa no Explorar | `new-pessoa` |

### 5.5 Arquivos / módulos (Explorar) — *must*

| Interface | Efeito | Evidência IDE |
|-----------|--------|---------------|
| `createModule` / `renameModule` | Arquivo `.js` | `createModuleBody` |
| `deleteModule` | Apaga módulo | `DELETE /modules/:mid` (**API sem UI**) |
| `listModules` / itens | Funções e dados sob arquivo | Explorer |
| `searchTree` | Filtrar árvore | Explorar ⌘K / `q` |

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

### 5.8 Seleção e UI de comando — *should*

| Interface | Efeito |
|-----------|--------|
| `select` / multi-select | Seleção por IDR |
| `openDrawer` / fechar painéis | Editar detalhe |
| `toggleKids` / abrir·fechar todos | Sanfona Flow |
| `toggleIndent` · `toggleIoCompact` · `toggleTxtIn` · `toggleDadosTodos` | Preferências de vista Flow |
| `zoom` / `pan` / `fit` | Viewport (host pode implementar; contrato opcional) |
| `toggleTerminal` / `termLog` / `clearTerm` | Terminal |
| `editMachineCode` | Código da etapa no MachPanel |

### 5.9 Fora da lib (host / plataforma)

Auth, CRUD de projeto SaaS, tema, toast, persistência HTTP, player T-xx do proto, Board/Gantt/Copiloto — host. A lib **não** os exige.

---

## 6. Lacunas

### 6.1 Vs rascunho v0.1 (só 5 criações)

Coberto no v0.1: criar função · entrada · saída · filho · irmão.

**Faltava para paridade Flow IDE:** rename · remove · archive · dup · move · cut/copy/paste · if/for/edge · paralelo · patch · dados (CRUD + clear + kid + cubo) · assign/clear responsável · task · CRUD agente/pessoa/modelo · módulos (+ delete) · search · openInFlow/reveal · copyIdr/path · run/cancel/complete/retry/runMachine · export · vista (sanfona, indent, terminal, …).

### 6.2 Achados da auditoria (produto vs contrato)

| Achado | Implicação na lib |
|--------|-------------------|
| Sem botão “criar entrada/saída” | `addInput`/`addOutput` são **API must**; UI é escolha do host (não inventar botão obrigatório) |
| `setParallel` só na API | Interface must; UI opcional |
| `deleteModule` só na API | Interface must; UI opcional |
| `move` sem botão dedicado | Cut/paste cobre; `move` permanece no contrato |
| Sequência liga/desliga no conector | Só visão/docs — **não** must até haver evidência de op |
| Setas mover / atalhos C·Tab·E | Removidos no PRD Flow.dev — **fora** |

### 6.3 Contradição v0.1 corrigida

Explorar / responsáveis / run / export eram não-objetivos; isso impedia cobrir o IDE. Desde v0.2+: **interfaces must**; chrome de plataforma fora.

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
| 5 operações de criação | Inventário §5 alinhado ao Flow IDE + auditoria |
| Entrada/saída como se fossem botões UI | Contrato de `ins`/`outs`; UI parcial no produto |
| Explorar / run / export fora | Interfaces must; chrome no host |

**Voltar:** escopo v0.1 (só as 5 criações).

## 12. Próximos passos

1. Fechar TypeScript das interfaces §5.1–5.3 (primeiro lote).
2. Espelhar nomes estáveis aos contratos Zod existentes.
3. Spike: `flow-dev` `addFn` / `setStruct` / `saveDado` → comandos da lib.
4. Lotes seguintes: §5.4–5.7.
