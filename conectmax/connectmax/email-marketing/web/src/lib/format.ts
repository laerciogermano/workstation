const number = new Intl.NumberFormat('pt-BR');
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const fmtNumber = (n: number) => number.format(n);
export const fmtDate = (iso: string | null) => (iso ? dateTime.format(new Date(iso)) : '—');

export const plural = (n: number, one: string, many: string) => `${fmtNumber(n)} ${n === 1 ? one : many}`;
