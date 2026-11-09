/** Gera chave de acesso de 44 dígitos com DV mod-11 válido. */
export function accessKeyWithDv(body43: string): string {
  let w = 2;
  let s = 0;
  for (let i = body43.length - 1; i >= 0; i--) {
    s += Number(body43[i]) * w;
    w = w === 9 ? 2 : w + 1;
  }
  const r = s % 11;
  return body43 + (r < 2 ? 0 : 11 - r);
}

export const KEY_JUPITER = accessKeyWithDv('4126110411841000012265001000048271102938441');
export const KEY_OTHER = accessKeyWithDv('4126110411841000012265001000048272102938441');
export const sefazUrl = (key: string) => `http://www.fazenda.pr.gov.br/nfce/qrcode?p=${key}|2|1|1|ABCDEF`;
