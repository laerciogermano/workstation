declare const __CLIENT_COMMAND__: string;
/** Em desenvolvimento aponta para o binário compilado no repositório. */
export const clientCommand = () => __CLIENT_COMMAND__;

/** O que fazer quando o client em execução é anterior ao play. */
export function oldClientHelp(): string {
  const command = clientCommand();
  // em desenvolvimento o binário é compilado no repositório; instalado, vem de um pacote
  const update = command === 'plans-client' ? 'instale a versão nova' : 'rode "npm run client:build" em plans/app';
  return `O client em execução é antigo e não sabe fazer o play. No terminal onde ele roda, pare com Ctrl+C, ${update} e rode "${command} run" de novo.`;
}

const windows = () => navigator.userAgent.includes('Windows');
const quote = (s: string) => (/^[\w@%+=:,./~\\-]+$/.test(s) ? s : windows() ? `"${s.replace(/"/g, '')}"` : `'${s.replace(/'/g, `'\\''`)}'`);

export function pairCommand(code: string, path: string, hub: string): string {
  const isDefault = hub === 'wss://plans.laerciogermano.com/ws';
  return `${clientCommand()} pair ${code} --dir ${path.trim() ? quote(path.trim()) : '<caminho-da-pasta>'}${isDefault ? '' : ` --hub ${hub}`}`;
}
