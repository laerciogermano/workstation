/** Normalização de descrição crua da DANFE para leitura humana (REQ-039). */
const ABBR: Record<string, string> = {
  ACHOC: 'Achocolatado', PO: 'em Pó', ACUC: 'Açúcar', REF: 'Refinado', BISC: 'Biscoito', CHOC: 'Chocolate',
  MAC: 'Macarrão', HIG: 'Higiênico', INT: 'Integral', LT: 'Lata', ORIG: 'Original', ABS: 'Absorvente',
  SALG: 'Salgadinho', ENERG: 'Energético', QJO: 'Queijo', MUSS: 'Muçarela', DET: 'Detergente', LIQ: 'Líquido',
  OLEO: 'Óleo', CAFE: 'Café', PAO: 'Pão', AGUA: 'Água', REQUEIJAO: 'Requeijão', INST: 'Instantâneo',
  VACUO: 'a Vácuo', REQ: 'Requeijão', GUARANA: 'Guaraná', ANTARCT: 'Antarctica', ACUCAR: 'Açúcar',
  ENERGETICO: 'Energético', CERV: 'Cerveja', REFRIG: 'Refrigerante', PCT: 'Pacote', UN: 'un',
};
const UNIT = /^\d+([.,]\d+)?(ML|G|GR|KG|L|LT|LTS)$/i;

export function humanizeDescription(raw: string): string {
  const t = raw
    .replace(/[#*+]/g, ' ')
    .replace(/\bL\.V\./g, 'LONGA VIDA ')
    .replace(/\bA\.ALEGRE\b/g, 'ALTO ALEGRE');
  return t
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((w) => {
      const u = w.toUpperCase();
      const abbr = ABBR[u];
      if (abbr) return abbr;
      if (UNIT.test(w)) return w.toLowerCase().replace(/gr$/, 'g').replace(/lts?$/, 'l');
      if (/^\d+x\d*/i.test(w)) return w.toLowerCase();
      return u.charAt(0) + u.slice(1).toLowerCase();
    })
    .join(' ')
    .trim();
}

/** Tokens úteis para comparar descrições (sugestão de EAN por similaridade). */
export function descriptionTokens(raw: string): string[] {
  return humanizeDescription(raw)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2);
}

/** Jaccard entre tokens (0..1). */
export function descriptionSimilarity(a: string, b: string): number {
  const A = new Set(descriptionTokens(a));
  const B = new Set(descriptionTokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

const STORE_STOP = /^(COMERCIO|COM|SUPERMERCADOS?|MERCADOS?|DISTRIBUIDORA|DISTRIBUIDOR|LTDA|S\/?A|S\.A\.?|EIRELI|ME|EPP|DE|DO|DA|E|VAREJISTA|ATACADO|ALIMENTOS|PRODUTOS|CENTRAL)$/i;

/** Razão social da DANFE → nome curto de exibição ("ATACADAO S.A." → "Atacadão" fica para curadoria; aqui "Atacadao"). */
export function storeDisplayName(legalName: string): string {
  const words = legalName.replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  for (const w of words) {
    if (STORE_STOP.test(w)) {
      if (kept.length) break;
      continue;
    }
    kept.push(w);
    if (kept.length === 2) break;
  }
  const name = (kept.length ? kept : words.slice(0, 2)).join(' ');
  return name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
