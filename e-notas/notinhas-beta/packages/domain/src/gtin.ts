/** GTIN (EAN-8, UPC-12, EAN-13, GTIN-14) com dígito verificador mod-10. */
export type Gtin = string & { readonly __brand: 'Gtin' };

export function isValidGtin(code: string): code is Gtin {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Remove espaços/traços; não corrige dígito. */
export const normalizeGtin = (raw: string): string => raw.replace(/\D/g, '');
