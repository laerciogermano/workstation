#!/usr/bin/env node
/**
 * Gera uma variação de mensagem via gpt-4o-mini (mesmo sentido, outra forma).
 *
 *   npm run vary-message
 *   node scripts/vary-message.js
 *   node scripts/vary-message.js "sua mensagem aqui"
 *
 * Requer OPENAI_API_KEY em src/.env. Rollback: remover este script e o npm script.
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "../lib/load-env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFiles([
  join(resolve(__dirname, ".."), ".env"),
  join(resolve(__dirname, ".."), ".env.local"),
]);

const DEFAULT =
  "oi, tudo bem. gostaria de te oferecer uma cartela de produtos para que voce possa analisar de acordo com suas necessidades e fazer um pedido";

const message = process.argv.slice(2).join(" ").trim() || DEFAULT;
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("falta OPENAI_API_KEY");
  process.exit(1);
}

const prompt = `Reescreva a mensagem abaixo com o mesmo sentido e intenção, mas com outra forma de se expressar (vocabulário, ordem e tom diferentes). Retorne só a mensagem reescrita, sem aspas nem explicação.

Mensagem:
${message}`;

const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 1,
    messages: [{ role: "user", content: prompt }],
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error(data?.error?.message || JSON.stringify(data));
  process.exit(1);
}

const text = data?.choices?.[0]?.message?.content?.trim();
if (!text) {
  console.error("resposta vazia");
  process.exit(1);
}

console.log(text);
