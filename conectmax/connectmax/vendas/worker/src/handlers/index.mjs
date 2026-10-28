import { run as conectar } from './conectar.mjs';
import { run as extrairLeads } from './extrair_leads.mjs';
import { run as verificarConexoes } from './verificar_conexoes.mjs';
import { makeStub } from './stub.mjs';

const handlers = {
  extrair_leads: extrairLeads,
  conectar,
  verificar_conexoes: verificarConexoes,
  ler_mensagens: makeStub('ler_mensagens'),
  enviar_prospeccao: makeStub('enviar_prospeccao'),
};

export function getHandler(type) {
  const h = handlers[type];
  if (!h) throw new Error(`tipo de job desconhecido: ${type}`);
  return h;
}
