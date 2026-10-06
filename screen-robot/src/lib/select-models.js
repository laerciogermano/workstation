/**
 * Prompt interativo: escolher um ou mais modelos do catálogo.
 */
import { createInterface } from "node:readline";
import { AGENT_MODELS, parseModelSelection } from "./agent-models.js";

/**
 * @param {{
 *   models?: import("./agent-models.js").AgentModel[],
 *   input?: NodeJS.ReadableStream,
 *   output?: NodeJS.WritableStream,
 *   question?: (q: string) => Promise<string>,
 * }} [opts]
 * @returns {Promise<import("./agent-models.js").AgentModel[]>}
 */
export async function selectModelsInteractive(opts = {}) {
  const models = opts.models || AGENT_MODELS;
  const out = opts.output || process.stdout;

  out.write("\nModelos de IA disponíveis:\n");
  models.forEach((m, i) => {
    out.write(`  ${i + 1}) ${m.label}  [${m.provider}/${m.id}]\n`);
  });
  out.write("  a) todos\n\n");

  const ask =
    opts.question ||
    ((prompt) =>
      new Promise((resolve) => {
        const rl = createInterface({
          input: opts.input || process.stdin,
          output: out,
          terminal: true,
        });
        rl.question(prompt, (answer) => {
          rl.close();
          resolve(answer);
        });
      }));

  const answer = await ask(
    "Escolha (número, vários separados por vírgula, id, ou a=todos): ",
  );
  const selected = parseModelSelection(answer, models);
  if (!selected.length) {
    const err = new Error(
      `seleção inválida: ${JSON.stringify(answer)}. Use 1-${models.length}, vírgulas, id ou a`,
    );
    err.code = "AGENT_MODEL_SELECT_INVALID";
    throw err;
  }
  out.write(
    `Selecionado: ${selected.map((m) => m.id).join(", ")}\n\n`,
  );
  return selected;
}

/**
 * Decide se deve abrir o menu (TTY + sem --model/--no-prompt).
 * @param {{ model?: string|null, noPrompt?: boolean, isTTY?: boolean }} cfg
 */
export function shouldPromptModels(cfg = {}) {
  if (cfg.noPrompt) return false;
  if (cfg.model) return false;
  const tty = cfg.isTTY ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  return tty;
}
