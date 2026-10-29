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

export function getHandler(type) {
  const h = handlers[type];
  if (!h) throw new Error(`tipo de job desconhecido: ${type}`);
  return h;
}
