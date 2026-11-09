/** T-71: nota lida sem rede entra numa fila local e sobe quando a conexão volta. */
const KEY = 'nt_pending_receipts';

export function queueReceipt(url: string) {
  const list = pending();
  if (!list.includes(url)) localStorage.setItem(KEY, JSON.stringify([...list, url]));
}
export function pending(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}
export function dequeue(url: string) {
  localStorage.setItem(KEY, JSON.stringify(pending().filter((u) => u !== url)));
}
