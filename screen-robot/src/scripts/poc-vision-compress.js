#!/usr/bin/env node
/**
 * POC: comprime fixture LinkedIn → WebP leve + prompt para colar na IA multimodal.
 *
 * Uso:
 *   node scripts/poc-vision-compress.js
 *   node scripts/poc-vision-compress.js --input test/fixtures/linkedin-tela-inicial.png
 *   npm run poc:vision
 *
 * Saída em test/output/poc-vision/:
 *   - compressed.webp  (anexar na IA)
 *   - prompt.md        (colar como texto)
 *   - meta.json        (tamanho, escala, estimativa de tiles)
 */

import { mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const inputRel = argValue(
  "--input",
  "test/fixtures/linkedin-people-comprador-connect.png",
);
const width = Number(argValue("--width", "540"));
const quality = Number(argValue("--quality", "60"));
const outDir = resolve(
  SRC_ROOT,
  argValue("--out", "test/output/poc-vision"),
);

const inputPath = resolve(SRC_ROOT, inputRel);
const raw = readFileSync(inputPath);
const metaIn = await sharp(raw).metadata();
const scale = metaIn.width / width;

const compressed = await sharp(raw)
  .resize({ width })
  .webp({ quality })
  .toBuffer();

mkdirSync(outDir, { recursive: true });
const webpPath = join(outDir, "compressed.webp");
const promptPath = join(outDir, "prompt.md");
const metaPath = join(outDir, "meta.json");

writeFileSync(webpPath, compressed);

// Gemini típico: ~258 tokens/tile 768×768; imagem ~540×H cabe em 1–2 tiles.
const outMeta = await sharp(compressed).metadata();
const tilesGuess = Math.max(
  1,
  Math.ceil(outMeta.width / 768) * Math.ceil((outMeta.height || 1) / 768),
);
const tokensImageGuess = tilesGuess * 258;

const meta = {
  input: inputRel,
  inputBytes: raw.length,
  outputBytes: compressed.length,
  ratio: Number((compressed.length / raw.length).toFixed(4)),
  original: { width: metaIn.width, height: metaIn.height },
  compressed: { width: outMeta.width, height: outMeta.height, format: "webp", quality },
  scaleToDevice: Number(scale.toFixed(4)),
  tokensImageGuess,
  tilesGuess,
  howToTest: [
    "Abrir um chat multimodal (Gemini / ChatGPT / Claude).",
    "Anexar test/output/poc-vision/compressed.webp",
    "Colar o texto de prompt.md",
  ],
};

writeFileSync(metaPath, JSON.stringify(meta, null, 2));

const prompt = `# Prompt — POC visão LinkedIn (colar na IA + anexar compressed.webp)

Anexe a imagem \`compressed.webp\` e cole o bloco abaixo.

---

Você é um agente que opera um smartphone Android olhando só a captura da tela.

Analise a imagem (LinkedIn, lista People / busca comprador) e responda em português:

1. **O que tem na tela** — resumo em 2–4 frases (aba, busca, tipo de lista).
2. **Elementos clicáveis** — lista com label/descrição e coordenada aproximada **na escala desta imagem** (largura ${outMeta.width}px):
   - botões tipo Connect / Pending / Message
   - chips (People, 1st, 2nd…)
   - cards de pessoa (nome + cargo se legível)
3. **Próxima ação sugerida** — se o objetivo for "conectar num comprador", diga \`tap\` com \`x,y\` na escala da imagem (${outMeta.width}×${outMeta.height}), ou \`scroll down\` se não houver Connect visível.

Responda em JSON:
\`\`\`json
{
  "resumo": "...",
  "elementos": [{ "label": "...", "tipo": "button|chip|card|text", "x": 0, "y": 0 }],
  "acao": { "type": "tap|scroll", "x": null, "y": null, "direction": null, "motivo": "..." }
}
\`\`\`

Para clicar no device real: multiplique x,y por scaleToDevice = ${meta.scaleToDevice} (ver meta.json).
`;

writeFileSync(promptPath, prompt);

console.log("POC visão — compressão LinkedIn");
console.log(`input:  ${inputPath} (${raw.length} bytes)`);
console.log(`output: ${webpPath} (${compressed.length} bytes, ${(meta.ratio * 100).toFixed(1)}% do original)`);
console.log(`size:   ${metaIn.width}×${metaIn.height} → ${outMeta.width}×${outMeta.height}`);
console.log(`tokens imagem (estimativa): ~${tokensImageGuess} (${tilesGuess} tile(s))`);
console.log(`prompt: ${promptPath}`);
console.log(`meta:   ${metaPath}`);
console.log("");
console.log("Teste manual: anexe compressed.webp na IA e cole prompt.md");
