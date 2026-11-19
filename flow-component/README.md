# Flow Component — Visão

**O quê:** lib front-end com **todas as interfaces** das operações do Flow IDE.  
**Como:** comandos tipados (função, I/O, dados, composição, responsável, run, export…); o host opta por operar.  
**Para quem:** Flow.dev e outros hosts do grafo Flow.

**PRD:** [`docs/prd.md`](docs/prd.md) (inventário + lacunas vs v0.1)

## Relação

```text
FOP → Flow Language → Flow Component ← Flow.dev / hosts
```

## Implementação (v0.1)

`@flow/component` — TypeScript estrito, ESM, **zero dependências em runtime**, sem canvas.

```ts
import { createFlowComponent, memoryStore } from "@flow/component";

const flow = createFlowComponent({ store: memoryStore(snapshot), disabled: ["deleteModule"] });
const r = await flow.createChild({ refId, title: "Cobrar" });   // uma função tipada por comando
if (r.ok) r.value.created;                                      // IDRs novos
// forma genérica equivalente: flow.execute({ type: "createChild", refId, title: "Cobrar" })
```

| Camada | Arquivo | Papel |
|---|---|---|
| Domínio | `src/types.ts` | Snapshot imutável (`readonly`), espelha `@flow/shared` |
| Contrato | `src/commands.ts` | União discriminada `Command` (§5.1–5.7) |
| Núcleo puro | `src/execute.ts`, `src/ops/*` | `(snapshot, comando) → Result<Applied>`; não muta, não faz I/O; tabela exaustiva (o compilador exige handler por comando) |
| Portas | `src/ports.ts` | `ModelStore`, `Runner`, `Exporter` injetáveis |
| Fachada | `src/component.ts` | uma função por comando (`flow.createChild(...)`, tipo `FlowApi`), `execute`, `can`, comandos desabilitáveis, erros tipados (`Result`) |

**Vista (front-end):** `mountFlowView(elemento, flow, opts)` desenha a vista Flow do IDE (tabela Responsável · Task + plano cartesiano com estados s0..sN, barras, if/for/paralelo, dados) e opera **só pelos comandos**; botão de **tela cheia** em toda vista (`view.fullscreen()`; Esc sai; nas vistas `readonly` liberam zoom e pan); cada `flow.execute` redesenha. A coluna Task (`scene.leftW`) cresce com a indentação (hierarquia + degrau do passo). Geometria pura em `src/view/scene.ts` (`buildScene`, testável sem DOM); renderer DOM/SVG em `src/view/flow-view.ts`, sem dependências.

```ts
import { createFlowComponent, memoryStore, mountFlowView } from "@flow/component";
const flow = createFlowComponent({ store: memoryStore(snapshot) });
const view = mountFlowView(document.getElementById("host")!, flow, { rootId });
```

Docs: `example/docs.html` (página única: menu lateral + rolagem, busca ⌘K, 12 temas do Flow IDE em bolinhas no header via `?tema=`; seção **Estruturas** com sequência/paralelo/if/for/try-catch/composição; cada funcionalidade: contrato → chamada → Depois/Antes/Mudanças → erros). Exemplos: `example/flow.html` (a vista + **código TypeScript gerado ao vivo** + painel “Chamar comando”). `npm run example:build` empacota a lib.

**Transpilador:** `generateTypeScript(snapshot, { rootId })` devolve `{ code, map, fileName }` — uma função `async (state)` por função do fluxo (composição = camada com `await`/`Promise.all`, `for`, `if` → “senão”, `try/catch` → tratamento; `through` faz um único try cobrir várias funções consecutivas) e o mapa função → linhas; `typeScriptExporter` pluga no `exportPlan`.

Fora da v0.1: §5.8 (Explorar, terminal, drawers/painéis, dado como elemento `kind:"data"` — fora da vista), `cut`/`copy` (clipboard é do host; `paste` carrega os ids), geradores de export e runtime de execução (portas).

```bash
npm install && npm run verify   # tsc --strict + vitest
```
