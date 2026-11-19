/**
 * Ponte para as ops LinkedIn CDP do worker em screen-robot.
 *
 * Fonte canônica de fluxo UI (DOM/trajetória) ainda vive em
 * `screen-robot/src/lib/cdp/`. Esta lib é a fachada estável.
 *
 * Antes → depois: importar `../lib/cdp/*.js` direto no worker →
 * `createLinkedInHumanCdp` / re-exports desta pasta.
 * Rollback: voltar aos imports em `screen-robot/src/lib/cdp/`.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKS_ROOT = resolve(__dirname, "../..");
const CDP_DIR = resolve(WORKS_ROOT, "screen-robot/src/lib/cdp");

const cache = new Map();

async function load(name) {
  if (cache.has(name)) return cache.get(name);
  const href = pathToFileURL(resolve(CDP_DIR, name)).href;
  const mod = await import(href);
  cache.set(name, mod);
  return mod;
}

export async function workerOps() {
  const [
    connectMod,
    connectionsMod,
    messageMod,
    unreadMod,
    profileMsgMod,
    leadsMod,
  ] = await Promise.all([
    load("linkedin-connect.js"),
    load("linkedin-extract-connections.js"),
    load("linkedin-message.js"),
    load("linkedin-unread-messages.js"),
    load("linkedin-profile-messages.js"),
    load("linkedin-extract-leads.js"),
  ]);
  return {
    connectByLinkedInUrl: connectMod.connectByLinkedInUrl,
    extractRecentConnections: connectionsMod.extractRecentConnections,
    sendLinkedInMessage: messageMod.sendLinkedInMessage,
    listUnreadMessages: unreadMod.listUnreadMessages,
    listProfileMessages: profileMsgMod.listProfileMessages,
    extractLeads: leadsMod.extractLeads,
  };
}
