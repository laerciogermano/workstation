/** Chave de acesso NFC-e: 44 dígitos, DV módulo 11 (pesos 2..9). */
export type AccessKey = string & { readonly __brand: 'AccessKey' };

export function normalizeAccessKey(raw: string | null | undefined): string | null {
  const d = String(raw ?? '').replace(/\D/g, '');
  return d.length === 44 ? d : null;
}

export function isValidAccessKey(key: string): key is AccessKey {
  if (!/^\d{44}$/.test(key)) return false;
  const body = key.slice(0, 43);
  let weight = 2;
  let sum = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  const dv = rest < 2 ? 0 : 11 - rest;
  return dv === Number(key[43]);
}

/** "4126 1104 …" em blocos de 4 para exibição. */
export const formatAccessKey = (key: string): string => key.replace(/(\d{4})(?=\d)/g, '$1 ');

/** UF (cUF) e CNPJ do emitente embutidos na chave. */
export function accessKeyParts(key: AccessKey): { uf: string; yymm: string; cnpj: string; model: string } {
  return { uf: key.slice(0, 2), yymm: key.slice(2, 6), cnpj: key.slice(6, 20), model: key.slice(20, 22) };
}
