import { run as conectar } from './conectar.mjs';
import { run as enviarProspeccao } from './enviar_prospeccao.mjs';
import { run as extrairLeads } from './extrair_leads.mjs';
import { run as lerMensagens } from './ler_mensagens.mjs';
import { run as verificarConexoes } from './verificar_conexoes.mjs';

const handlers = {
  extrair_leads: extrairLeads,
  conectar,
  verificar_conexoes: verificarConexoes,
  ler_mensagens: lerMensagens,
  enviar_prospeccao: enviarProspeccao,
};

export function getCdpHandler(type) {
  const h = handlers[type];
  if (!h) throw new Error(`tipo de job desconhecido (cdp): ${type}`);
  return h;
}

export function isCdpRuntime() {
  const runtime = String(process.env.WORKER_RUNTIME || '').toLowerCase();
  if (runtime === 'cdp' || runtime === 'chrome') return true;
  if (runtime === 'avd' || runtime === 'adb') return false;
  return Boolean(
    String(process.env.CDP_ID || '').trim() ||
      String(process.env.CDP_URL || '').trim(),
  );
}
