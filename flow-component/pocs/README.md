# POCs — visualização Flow

Inventário das provas de conceito / protótipos cujo objetivo foi **criar a visualização Flow** (plano cartesiano FOP: tabela + barras, dados, if/for/paralelo). Entradas em ordem cronológica aproximada. Cada pasta é um symlink para o projeto original.

| # | POC | Origem | O quê |
|---|-----|--------|-------|
| 00 | [`00-gantt-sample.png`](00-gantt-sample.png) | [`flow/input/`](../../flow/README.md) | Referência visual original (Gantt escuro) |
| 01 | [`01-plans-prototipo/`](01-plans-prototipo/index.html) | [`plans/prototipo/`](../../plans/prototipo/index.html) | Primeira tela Flow no Plans (T-32 / EP-07) |
| 02 | [`02-flow-dev-prototipo/`](02-flow-dev-prototipo/index.html) | [`flow-dev/prototipo/`](../../flow-dev/prototipo/index.html) | Flow IDE (Explorar + Flow), corte do Plans |
| 03 | [`03-flow-language-editor/`](03-flow-language-editor/README.md) | [`flow-language/editor/`](../../flow-language/editor/README.md) | Mesmo canvas + código JS ao vivo |
| 04 | [`04-mount-flow-view/`](04-mount-flow-view/) | [`../src/view/`](../src/view/) | Lib `mountFlowView` / `buildScene` (DOM/SVG) |
| 05 | [`05-flow-component-example/`](05-flow-component-example/) | [`../example/`](../example/) | Demos (`flow.html`, docs, temas) |
| 06 | [`06-flow-novo-ast/`](06-flow-novo-ast/) | [`../novo/`](../novo/) | Editor FOP/AST (`flow-novo`) |
| 07 | [`07-flow-dev-react-view/`](07-flow-dev-react-view/) | [`flow-dev/.../features/flow/`](../../flow-dev/app/apps/web/src/features/flow/) | `FlowView.tsx` no app React |
| 08 | [`08-fop-site-referencia/`](08-fop-site-referencia/README.md) | [`../docs/referencia/`](../docs/referencia/README.md) | Snapshot HTML do site FOP |

**Abrir:** seguir o README de cada origem (HTML estático ou app Vite).

**Antes → depois:** POCs espalhados em `plans/`, `flow-dev/`, `flow-language/` e `flow-component/` → índice único aqui. **Voltar:** apagar `flow-component/pocs/`.
