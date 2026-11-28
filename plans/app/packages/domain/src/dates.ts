// Datas do cartão: o arquivo guarda data e hora (ISO); na tela vale o dia no fuso de quem vê.
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n: number, size = 2) => String(n).padStart(size, '0');

/** `AAAA-MM-DD` no fuso local; undefined se a data não é legível. */
export function localDay(iso: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  // escrita à mão só com o dia: é esse dia em qualquer fuso
  if (DAY.test(iso)) return iso;
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Troca o dia e mantém a hora local (meio-dia se a atual não é legível); undefined se o dia não existe. */
export function withLocalDay(iso: string, day: string): string | undefined {
  const m = DAY.exec(day);
  if (!m) return undefined;
  const [year, month, dayOfMonth] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || DAY.test(iso)) date.setTime(new Date(2000, 0, 1, 12).getTime());
  date.setFullYear(year, month, dayOfMonth);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== dayOfMonth) return undefined;
  return date.toISOString();
}
