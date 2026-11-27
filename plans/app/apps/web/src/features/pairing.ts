declare const __CLIENT_COMMAND__: string;
/** Em desenvolvimento aponta para o binário compilado no repositório. */
export const clientCommand = () => __CLIENT_COMMAND__;

const windows = () => navigator.userAgent.includes('Windows');
const quote = (s: string) => (/^[\w@%+=:,./~\\-]+$/.test(s) ? s : windows() ? `"${s.replace(/"/g, '')}"` : `'${s.replace(/'/g, `'\\''`)}'`);

export function pairCommand(code: string, path: string, hub: string): string {
  const isDefault = hub === 'wss://plans.laerciogermano.com/ws';
  return `${clientCommand()} pair ${code} --dir ${path.trim() ? quote(path.trim()) : '<caminho-da-pasta>'}${isDefault ? '' : ` --hub ${hub}`}`;
}
