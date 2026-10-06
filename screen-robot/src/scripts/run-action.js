#!/usr/bin/env node
/**
 * Uma ação da lib por invocação. Uso a partir de screen-robot/src:
 *   npm run extract
 *   npm run tap -- 360 640
 */
import { defaultConfigPath, parseRunArgs, runAction } from "../lib/run-action.js";

function usage(code = 1) {
  console.error(`Uso (cwd: screen-robot/src):
  npm run extract [-- --engine all]
  npm run find -- "Sign in with Email"
  npm run tap -- <x> <y>
  npm run type -- "texto"
  npm run scroll -- down|up|left|right [distance]
  npm run launch -- linkedin|com.linkedin.android
  npm run key -- KEYCODE_BACK
  npm run wait -- 1500

Flags: --device SERIAL  --engine all|rapidocr|…  --method adb|ocr  --config path
Stdout: JSON { ok, action, serial, result }`);
  process.exit(code);
}

async function main() {
  const parsed = parseRunArgs(process.argv.slice(2));
  if (parsed.help || !parsed.action) usage(parsed.help ? 0 : 1);
  const configPath = parsed.configPath || defaultConfigPath();
  const out = await runAction({ ...parsed, configPath });
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch((e) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: e.message || String(e),
      code: e.code || null,
    }),
  );
  process.exit(1);
});
