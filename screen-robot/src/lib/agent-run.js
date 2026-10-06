/**
 * Entry do agent — aponta para o v1 (loop completo).
 *
 * - Ativo: [`agent-run-v1.js`](./agent-run-v1.js) — extract → decide → operate + log/usage/vision/history
 * - Alternativa: [`agent-run-2.0.js`](./agent-run-2.0.js) — loop mínimo (askProvider)
 *
 * Voltar ao 2.0: `export { runAgent, executeAction } from "./agent-run-2.0.js"`.
 */
export { runAgent, executeAction } from "./agent-run-v1.js";
