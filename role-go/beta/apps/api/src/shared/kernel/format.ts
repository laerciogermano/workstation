/** Formatação pt-BR na borda (e-mail, OG). */
export function formatWhen(d: Date, tz = 'America/Sao_Paulo'): string {
  const s = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
  return s.replace(/\./g, '').replace(/^(\w)/, (m) => m.toUpperCase());
}
export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
