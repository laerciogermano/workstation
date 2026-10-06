#!/usr/bin/env node
/**
 * Chamada crua chat.completions — imprime só o texto da resposta.
 *
 *   node scripts/raw-gpt.js
 *   node scripts/raw-gpt.js -- "outro prompt"
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "../lib/load-env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFiles([
  join(resolve(__dirname, ".."), ".env"),
  join(resolve(__dirname, ".."), ".env.local"),
]);

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("falta OPENAI_API_KEY");
  process.exit(1);
}

const prompt =
  process.argv.slice(2).find((a) => a !== "--") || "Me chama no insta";
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

const payload = {
  model,
  messages: [{ role: "user", content: prompt }],
};
console.log(payload);

const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const data = await res.json();
if (!res.ok) {
  console.error(data?.error?.message || JSON.stringify(data));
  process.exit(1);
}

process.stdout.write(String(data.choices?.[0]?.message?.content ?? ""));
