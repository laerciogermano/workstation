// Empacota a lib (IIFE → window.FlowComponent) e gera example/contracts.js a partir de src/commands.ts
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
await build({
  entryPoints: [join(root, "src/index.ts")], outfile: join(root, "example/flow-component.js"),
  bundle: true, format: "iife", globalName: "FlowComponent", target: "es2022", minify: false, logLevel: "info",
});

// versão nova (do zero): novo/ → example/flow-novo.js
await build({ entryPoints: [join(root, "novo/app.ts")], outfile: join(root, "example/flow-novo.js"), bundle: true, format: "iife", target: "es2022", minify: false, logLevel: "info" });

// lib AST → SVG (funções): docs/fn-svg.js para indice-ast.html
await build({
  entryPoints: [join(root, "novo/ast/fn-svg.ts")],
  outfile: join(root, "docs/fn-svg.js"),
  bundle: true, format: "iife", globalName: "FlowAst", target: "es2022", minify: false, logLevel: "info",
});

const src = readFileSync(join(root, "src/commands.ts"), "utf8");
const clean = t => t.replace(/readonly /g, "").replace(/\s+/g, " ").trim();
const contracts = {};
for (const line of src.split("\n")) {
  const m = line.match(/^\s*\| \{ readonly type: "(\w+)"(?:; )?(.*)\}(?:;)?\s*$/);
  if (!m) continue;
  const fields = clean(m[2]).replace(/;\s*$/, "");
  contracts[m[1]] = fields ? `{ ${fields} }` : "{}";
}
const patch = src.match(/export interface FunctionPatch \{([\s\S]*?)\n\}/)?.[1] ?? "";
const fnPatch = patch.split("\n").map(l => l.replace(/\/\*\*.*?\*\//g, "").replace(/readonly /g, "").trim()).filter(Boolean).join("\n  ");
writeFileSync(join(root, "example/contracts.js"), `// GERADO por example/build.mjs a partir de src/commands.ts — não editar\nconst CONTRACTS = ${JSON.stringify(contracts, null, 2)};\nconst FUNCTION_PATCH = ${JSON.stringify(`interface FunctionPatch {\n  ${fnPatch}\n}`)};\n`);
console.log("contracts:", Object.keys(contracts).length);

// projeto com o arquivo samples.ts (não é o padrão): example/fop-samples.json, para abrir com Open
{
  const { tmpdir } = await import("node:os"), tmp = join(tmpdir(), `fop-samples-${process.pid}.mjs`);
  await build({ entryPoints: [join(root, "novo/sample.ts"), join(root, "novo/model.ts")], outdir: join(tmpdir(), `fop-samples-${process.pid}`), bundle: true, format: "esm", platform: "node", logLevel: "silent" });
  const dir = join(tmpdir(), `fop-samples-${process.pid}`), sm = await import(join(dir, "sample.js")), md = await import(join(dir, "model.js"));
  writeFileSync(join(root, "example/fop-samples.json"), md.serialize(sm.samplesProject().project)); void tmp;
}
