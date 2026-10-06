/**
 * Entry do agent — temporariamente aponta para 2.0 (loop mínimo).
 *
 * - Ativo: [`agent-run-2.0.js`](./agent-run-2.0.js) — extract → askProvider → operate
 * - Preservado: [`agent-run-v1.js`](./agent-run-v1.js) — loop completo (log, usage, vision, history…)
 *
 * Rollback: trocar o re-export abaixo para `./agent-run-v1.js`.
 */
export { runAgent, executeAction } from "./agent-run-2.0.js";
