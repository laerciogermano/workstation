#!/usr/bin/env node
/**
 * agent-worker — pull uniforme (servidor ou gestor).
 *
 * Single (1 AVD):
 *   AGENT_ID=agent-d AGENT_API_KEY=… SERIAL=127.0.0.1:5560 npm start
 *
 * Host supervisor (N slots, rodízio de AVDs):
 *   MODE=host HOST_KEY=localhost AGENT_API_KEY=… npm run start:host
 *
 *   DRY=1 · ONCE=1 · ALLOW_STUB=1 · SKIP_DOCKER=1 · IDLE_BEFORE_SLEEP=2
 */
import { hostname } from 'node:os';
import { createApiClient } from './api.mjs';
import { runAgentCycle } from './agent-cycle.mjs';

const MODE = (process.env.MODE || 'single').toLowerCase();

if (MODE === 'host') {
  const { runSupervisor } = await import('./supervisor.mjs');
  await runSupervisor();
  process.exit(0);
}

const API_URL = (process.env.API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
const AGENT_ID = process.env.AGENT_ID || 'agent-d';
const API_KEY = process.env.AGENT_API_KEY || '';
const DRY = process.env.DRY === '1';
const ONCE = process.env.ONCE === '1';
const SLEEP_MS = Number(process.env.SLEEP_MS || 15_000);
const HEARTBEAT_MS = Number(process.env.HEARTBEAT_MS || 60_000);
const WORKER_VERSION = process.env.WORKER_VERSION || '0.1.0';
const HOST_INSTANCE_ID =
  process.env.HOST_INSTANCE_ID || `${hostname()}:${process.pid}`;
const SERIAL = process.env.SERIAL || process.env.ADB_SERIAL || '';

const api = createApiClient({ apiUrl: API_URL, apiKey: API_KEY });

async function heartbeat() {
  try {
    await api.heartbeat(AGENT_ID, {
      hostInstanceId: HOST_INSTANCE_ID,
      workerVersion: WORKER_VERSION,
    });
  } catch (e) {
    console.error(`[${AGENT_ID}] heartbeat:`, e.message || e);
  }
}

async function main() {
  if (!API_KEY) {
    console.warn(
      '[agent-worker] AGENT_API_KEY vazio — use chave do agente ou AGENT_API_KEY global',
    );
  }
  console.log(
    `agent-worker API=${API_URL} AGENT=${AGENT_ID} DRY=${DRY ? 1 : 0} SERIAL=${SERIAL || '(env)'}`,
  );
  await heartbeat();
  const hb = setInterval(heartbeat, HEARTBEAT_MS);

  try {
    for (;;) {
      try {
        await runAgentCycle(api, {
          agentId: AGENT_ID,
          serial: SERIAL,
          apiUrl: API_URL,
          apiKey: API_KEY,
          dry: DRY,
        });
      } catch (e) {
        console.error(`[${AGENT_ID}] erro:`, e.message || e);
      }
      if (ONCE) break;
      await new Promise((r) => setTimeout(r, SLEEP_MS));
    }
  } finally {
    clearInterval(hb);
  }
}

main();
