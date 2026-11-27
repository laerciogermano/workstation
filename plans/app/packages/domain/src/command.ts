/**
 * Separa uma linha em programa e argumentos, com aspas simples e duplas e "\" fora das aspas simples.
 * Não é um shell: sem variáveis, pipes ou curingas.
 */
export function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let has = false;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    const next = line[i + 1];
    if (quote) {
      if (c === quote) quote = null;
      // dentro de aspas duplas, "\" só escapa aspas e barra (caminhos do Windows ficam intactos)
      else if (c === '\\' && quote === '"' && (next === '"' || next === '\\')) cur += line[++i];
      else cur += c;
    } else if (c === '"' || c === "'") {
      quote = c;
      has = true;
    } else if (c === '\\' && next !== undefined && /[\s"'\\]/.test(next)) {
      cur += line[++i];
      has = true;
    } else if (/\s/.test(c)) {
      if (has) out.push(cur);
      cur = '';
      has = false;
    } else {
      cur += c;
      has = true;
    }
  }
  if (quote) throw new Error('Aspas não fechadas.');
  if (has) out.push(cur);
  return out;
}

export function describeCommand(c: { program?: string | undefined; args?: string[] | undefined; script?: string | undefined }): string {
  if (c.script !== undefined) return c.script;
  return [c.program ?? '', ...(c.args ?? [])].map((p) => (/^[\w@%+=:,./\\-]+$/.test(p) ? p : JSON.stringify(p))).join(' ');
}
