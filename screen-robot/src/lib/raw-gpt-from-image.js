/**
 * Motor estilo motor2: extractFromImage → compactOcr → decideRawAction (código atual).
 * Não altera raw-gpt-decide.js; só encapsula.
 */
import { compactOcr } from "./agent-decide.js";
import { extractFromImage } from "./extract-engines.js";
import { decideRawAction } from "./raw-gpt-decide.js";

/**
 * @param {{
 *   imagePath: string,
 *   prompt: string,
 *   step?: string|number|null,
 *   apiKey?: string,
 *   model?: string,
 *   engine?: string,
 *   timeoutMs?: number,
 * }} opts
 * @returns {Promise<{
 *   action: { type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number },
 *   proximoPasso?: string,
 *   ocr: object[],
 *   elements: object[],
 *   raw?: string,
 *   payload?: object,
 * }>}
 */
export async function decideFromImage(opts) {
  const imagePath = opts.imagePath;
  if (!imagePath) {
    const err = new Error("falta imagePath");
    err.code = "RAW_GPT_NO_IMAGE";
    throw err;
  }
  const engine = opts.engine || process.env.SCREEN_ROBOT_OCR || "all";
  const timeoutMs =
    opts.timeoutMs ?? Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000);
  const elements = await extractFromImage(imagePath, { engine, timeoutMs });
  const ocr = compactOcr(elements);
  const out = await decideRawAction({
    prompt: opts.prompt,
    ocr,
    step: opts.step,
    apiKey: opts.apiKey,
    model: opts.model,
  });
  const { raw, payload, proximoPasso, ...action } = out;
  return { action, proximoPasso, ocr, elements, raw, payload };
}
