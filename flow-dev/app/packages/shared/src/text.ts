export const slug = (t: string): string =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const slugFile = (t: string): string => slug(t).replace(/_/g, "-");
export const camel = (t: string): string => slug(t).replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
/** Nome de função = verbo no infinitivo (Comprar celular, Enviar proposta). */
export const isVerbTitle = (t: string): boolean => {
  const w = String(t).trim().split(/\s+/)[0]!.toLowerCase().replace(/-(se|lo|la|los|las)$/, "");
  return /(ar|er|ir|or|ôr)$/.test(w) && w.length > 2;
};
