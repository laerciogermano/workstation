/** Porta para a consulta pública da NFC-e (ADR-004). Adaptador real: sefaz-pr.adapter.ts. */
export interface ParsedDanfe {
  store: {
    legalName: string;
    cnpj: string;
    address: string | null;
    neighborhood: string | null;
    city: string | null;
  };
  receipt: {
    accessKey: string;
    number: string | null;
    series: string | null;
    issuedAt: Date | null;
    protocol: string | null;
    totalCents: number | null;
    discountCents: number | null;
  };
  items: {
    lineNo: number;
    storeCode: string;
    description: string;
    quantity: number;
    unit: string | null;
    unitPriceCents: number;
    totalCents: number;
  }[];
}

export type SefazErrorCode = 'SEFAZ_TIMEOUT' | 'SEFAZ_PARSER_ERROR';

export class SefazError extends Error {
  readonly code: SefazErrorCode;
  constructor(code: SefazErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface SefazPort {
  /** Baixa e interpreta a DANFE. Lança SefazError. */
  fetchReceipt(url: string): Promise<ParsedDanfe>;
}
