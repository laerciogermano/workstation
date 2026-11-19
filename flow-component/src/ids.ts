/** Gerador de IDR injetável (testes usam sequência; produção usa UUID v4/v7 do host). */
export type IdGen = () => string;
export const uuidGen: IdGen = () => crypto.randomUUID();
export const sequentialGen = (prefix = "id"): IdGen => { let n = 0; return () => `${prefix}-${++n}`; };
