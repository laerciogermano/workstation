/** Escapa curingas do LIKE para busca textual segura (o valor já vai parametrizado). */
export const likeContains = (q: string): string => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
