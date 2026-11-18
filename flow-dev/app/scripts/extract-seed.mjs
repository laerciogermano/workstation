// Extrai os dados de exemplo do protótipo (flow-dev/prototipo/index.html) para JSON.
// Uso: node scripts/extract-seed.mjs > apps/api/src/seed/prototype-seed.json
import { readFileSync } from "node:fs";
import vm from "node:vm";
const lines = readFileSync(new URL("../../prototipo/index.html", import.meta.url), "utf8").split("\n");
// 1277..1550 = dados + utilidades puras (sem DOM)
const src = lines.slice(1276, 1550).join("\n").replace(/^const /gm, "var ").replace(/^let /gm, "var ");
const ctx = { matchMedia: () => ({ matches: false }), icon: () => "", console };
vm.createContext(ctx);
vm.runInContext(src + "\nensureLayers();", ctx);
const out = vm.runInContext(
  "JSON.stringify({CAT,AGENT_CFG,MODELS,LAYERS,U,DEPS,PARS,STRUCTS,DATA_KIDS,DATA_TYPE,DATA_VAL,PLANS})", ctx);
process.stdout.write(JSON.stringify(JSON.parse(out), null, 1));
