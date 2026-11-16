import { normalizeEmail } from '../../shared/email.ts';

export type ParsedContact = { email: string; name: string | null };
export type ImportParseResult = {
  contacts: ParsedContact[];
  invalid: { line: number; content: string }[];
  duplicatesInInput: number;
};

const SEPARATOR = /[,;\t]/;
const HEADER = /^\s*"?e-?mail"?\s*([,;\t]|$)/i;

function unquote(v: string): string {
  const t = v.trim();
  return t.startsWith('"') && t.endsWith('"') && t.length >= 2 ? t.slice(1, -1).replace(/""/g, '"').trim() : t;
}

/**
 * Aceita o que o operador cola de planilha ou CSV:
 *   email
 *   email, nome        (separador , ; ou tab)
 *   nome <email>
 * Linha de cabeçalho "email,..." é ignorada. Linhas vazias também.
 */
export function parseContactsImport(text: string): ImportParseResult {
  const contacts: ParsedContact[] = [];
  const invalid: ImportParseResult['invalid'] = [];
  const seen = new Set<string>();
  let duplicatesInInput = 0;

  const lines = text.split(/\r?\n/);
  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    if (index === 0 && HEADER.test(line)) return;

    let email: string | null = null;
    let name: string | null = null;

    const angle = line.match(/^(.*)<([^>]+)>\s*$/);
    if (angle) {
      email = normalizeEmail(angle[2] ?? '');
      name = unquote(angle[1] ?? '') || null;
    } else {
      const [first = '', ...rest] = line.split(SEPARATOR);
      email = normalizeEmail(unquote(first));
      name = unquote(rest.join(' ')) || null;
    }

    if (!email) {
      invalid.push({ line: index + 1, content: line.slice(0, 200) });
      return;
    }
    if (seen.has(email)) {
      duplicatesInInput += 1;
      return;
    }
    seen.add(email);
    contacts.push({ email, name: name ? name.slice(0, 200) : null });
  });

  return { contacts, invalid, duplicatesInInput };
}
