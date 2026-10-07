/**
 * Grava request/response literal em usage-2.0/<timestamp>.json
 * Formato: { entrada, resposta }
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 23);
}

/** Nome único sob usageDir: timestamp com ms; colisão → -2, -3… */
export function uniqueUsagePath(usageDir) {
  let base = stamp();
  let path = join(usageDir, `${base}.json`);
  let n = 1;
  while (existsSync(path)) {
    n += 1;
    path = join(usageDir, `${base}-${n}.json`);
  }
  return path;
}

/**
 * @param {{
 *   usageDir?: string,
 *   entrada: unknown,
 *   resposta: unknown,
 * }} opts
 * @returns {string} path do JSON gravado
 */
export function writeUsage20(opts) {
  const usageDir = resolve(opts.usageDir || join(process.cwd(), "usage-2.0"));
  mkdirSync(usageDir, { recursive: true });
  const path = uniqueUsagePath(usageDir);
  writeFileSync(
    path,
    JSON.stringify({ entrada: opts.entrada, resposta: opts.resposta }, null, 2) +
      "\n",
    "utf8",
  );
  return path;
}
