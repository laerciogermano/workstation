/**
 * Carrega KEY=VALUE de arquivos .env (sem sobrescrever env já setado).
 */
import { existsSync, readFileSync } from "node:fs";

/**
 * @param {string[]} paths
 */
export function loadEnvFiles(paths) {
  for (const path of paths) {
    if (!path || !existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const i = s.indexOf("=");
      if (i <= 0) continue;
      const key = s.slice(0, i).trim();
      let val = s.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null || process.env[key] === "") {
        process.env[key] = val;
      }
    }
  }
}
