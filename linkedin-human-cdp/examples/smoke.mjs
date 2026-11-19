/**
 * Smoke: instancia o cliente e lista métodos (não abre Chrome se faltar CDP_ID).
 *
 *   CDP_ID=marina-costa npm run example:smoke
 *   CDP_ID=marina-costa node examples/smoke.mjs --run recentConnections
 */
import { createLinkedInHumanCdp } from "../src/index.js";

const cdpId = process.env.CDP_ID || "";
const cdpUrl = process.env.CDP_URL || "";
const run = process.argv.includes("--run")
  ? process.argv[process.argv.indexOf("--run") + 1]
  : null;

if (!cdpId && !cdpUrl) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "dry",
        methods: [
          "connect",
          "recentConnections",
          "sendMessage",
          "unreadMessages",
          "profileMessages",
          "searchLeads",
          "extractLeads",
          "withPage",
          "resolvePage",
        ],
        hint: "defina CDP_ID ou CDP_URL e --run <método>",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const li = createLinkedInHumanCdp({ cdpId: cdpId || undefined, cdpUrl: cdpUrl || undefined });

if (!run) {
  console.log(JSON.stringify({ ok: true, mode: "client", cdpId: li.options.cdpId, cdpUrl: li.options.cdpUrl }, null, 2));
  process.exit(0);
}

let result;
switch (run) {
  case "recentConnections":
    result = await li.recentConnections({ n: Number(process.env.N || 5) });
    break;
  case "unreadMessages":
    result = await li.unreadMessages({ maxResults: Number(process.env.N || 5) });
    break;
  case "searchLeads":
    result = await li.searchLeads({
      query: process.env.QUERY || "comprador",
      n: Number(process.env.N || 3),
    });
    break;
  default:
    console.error(`método não suportado no smoke: ${run}`);
    process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
