// Tudo o que se sabe sobre um cartão, juntado para a IA escrever a descrição. Quem lê a pasta é quem chama.
import { PRIORITY_LABEL, SIDES, STATUS_LABEL, type Side } from '@plans/domain';
import { readDocument, readSheets } from '../features/office.ts';
import { fileKind, looksBinary } from '../features/preview.ts';
import type { ActivityFiles, Snapshot } from '../folder/project.ts';

type CardComment = { author: string | null; text: string };
/** sem `text`: só o nome é conhecido (imagem, vídeo, PDF, arquivo grande demais…) */
type CardAttachment = { side: Side; name: string; text?: string };

export type CardContext = {
  title: string;
  description: string;
  status?: string;
  priority?: string;
  /** AAAA-MM-DD */
  dueDate?: string;
  /** do topo da árvore até o pai direto */
  ancestors: { title: string; description: string; comments?: CardComment[]; attachments?: CardAttachment[] }[];
  children: { title: string; status: string }[];
  siblings: string[];
  systemPrompt: string;
  comments: CardComment[];
  attachments: CardAttachment[];
};

/** `owner` é a atividade dona do anexo: o cartão ou um dos pais. */
export type ReadAttachment = (side: Side, name: string, owner: string) => Promise<Blob>;

/** Texto e planilhas maiores que isto entram só pelo nome. */
const ATTACHMENT_BYTES = 2_000_000;
/** Quantos anexos (do cartão e depois dos pais) têm o conteúdo lido; os demais entram pelo nome. */
const ATTACHMENTS_READ = 10;
const SHEET_ROWS = 50;

/** Cada trecho e o conjunto têm um teto: modelos básicos aceitam pouco texto. */
export const PART_LIMIT = 4_000;
export const PROMPT_LIMIT = 24_000;

/** O conteúdo do anexo em texto, ou undefined quando não dá para ler. */
export async function attachmentText(name: string, blob: Blob): Promise<string | undefined> {
  if (blob.size > ATTACHMENT_BYTES) return undefined;
  const { kind } = fileKind(name);
  try {
    if (kind === 'sheet') {
      const sheets = await readSheets(blob, SHEET_ROWS);
      return sheets.map((s) => `Planilha ${s.name}:\n${s.rows.map((r) => r.join(' | ')).join('\n')}`).join('\n\n');
    }
    if (kind === 'document') {
      const { blocks } = await readDocument(blob);
      return blocks.map((b) => (b.type === 'text' ? b.text : b.rows.map((r) => r.join(' | ')).join('\n'))).join('\n');
    }
    if (kind !== 'text' && kind !== 'markdown' && kind !== 'table' && kind !== 'unknown') return undefined;
    const text = await blob.text();
    return looksBinary(text) ? undefined : text;
  } catch {
    return undefined; // anexo corrompido não impede a geração
  }
}

/** Sem `parentFiles`, os pais entram só com título e descrição. */
export async function buildCardContext(
  snapshot: Snapshot, id: string, files: ActivityFiles, read: ReadAttachment, parentFiles?: (id: string) => Promise<ActivityFiles>,
): Promise<CardContext> {
  const byId = new Map(snapshot.activities.map((a) => [a.id, a]));
  const card = byId.get(id);
  if (!card) throw new Error('A atividade não existe mais na pasta.');

  let left = ATTACHMENTS_READ;
  const attachmentsOf = async (owner: string, of: ActivityFiles) => {
    const listed = SIDES.flatMap((side) => of[side].map((f) => ({ side, name: f.name, size: f.size })));
    const out: CardAttachment[] = [];
    for (const { side, name, size } of listed) {
      let text: string | undefined;
      if (left > 0 && size <= ATTACHMENT_BYTES) {
        // removido entre a listagem e a leitura: fica só o nome
        text = await read(side, name, owner).then((blob) => attachmentText(name, blob), () => undefined);
        if (text?.trim()) left--;
      }
      out.push({ side, name, ...(text?.trim() ? { text } : {}) });
    }
    return out;
  };
  const commentsOf = (of: ActivityFiles) => of.comments.map((c) => ({ author: c.author, text: c.text }));
  const attachments = await attachmentsOf(id, files);

  // do pai direto para o topo: os mais próximos têm o conteúdo dos anexos lido primeiro
  const ancestors: CardContext['ancestors'] = [];
  const seen = new Set([id]);
  for (let p = card.parent; p && !seen.has(p); p = byId.get(p)?.parent ?? null) {
    seen.add(p);
    const parent = byId.get(p);
    if (!parent) continue;
    const own = await parentFiles?.(p);
    ancestors.unshift({
      title: parent.title,
      description: parent.description,
      ...(own?.comments.length ? { comments: commentsOf(own) } : {}),
      ...(own && own.input.length + own.output.length ? { attachments: await attachmentsOf(p, own) } : {}),
    });
  }

  return {
    title: card.title,
    description: card.description,
    status: STATUS_LABEL[card.status ?? 'todo'],
    ...(card.priority ? { priority: PRIORITY_LABEL[card.priority] } : {}),
    ...(card.dueDate ? { dueDate: card.dueDate } : {}),
    ancestors,
    children: snapshot.activities.filter((a) => a.parent === id).map((a) => ({ title: a.title, status: STATUS_LABEL[a.status ?? 'todo'] })),
    siblings: card.parent ? snapshot.activities.filter((a) => a.parent === card.parent && a.id !== id).map((a) => a.title) : [],
    systemPrompt: snapshot.systemPrompt.text,
    comments: commentsOf(files),
    attachments,
  };
}

const cut = (text: string, limit: number) => (text.length > limit ? `${text.slice(0, limit)}\n[…cortado]` : text);

/**
 * O contexto em texto, do mais importante para o menos: se passar do teto, o que sai é o fim.
 * Só dados; as instruções para o modelo são de quem gera.
 */
export function contextToPrompt(c: CardContext): string {
  const head = [`Título: ${c.title}`, c.status && `Status: ${c.status}`, c.priority && `Prioridade: ${c.priority}`, c.dueDate && `Data de entrega: ${c.dueDate}`];
  const parts: string[] = [`## Atividade\n${head.filter(Boolean).join('\n')}`];
  const add = (heading: string, lines: string[]) => lines.length && parts.push(`## ${heading}\n${lines.join('\n')}`);
  const block = (text: string) => cut(text.trim(), PART_LIMIT);

  if (c.description.trim()) parts.push(`## Descrição atual\n${block(c.description)}`);
  add('Atividades acima desta (do topo ao pai direto)', c.ancestors.map((a) => `- ${a.title}${a.description.trim() ? `\n${block(a.description)}` : ''}`));
  add('Subatividades', c.children.map((a) => `- ${a.title} (${a.status})`));
  const comment = (m: CardComment) => `- ${m.author ?? 'sem autor'}: ${block(m.text)}`;
  const attachment = (a: CardAttachment) => `- [${a.side}] ${a.name}${a.text ? `\n${block(a.text)}` : ''}`;
  add('Comentários', c.comments.map(comment));
  add('Anexos', c.attachments.map(attachment));
  // o pai direto primeiro: é o que mais explica o cartão
  for (const a of [...c.ancestors].reverse()) {
    add(`Comentários de "${a.title}" (acima)`, (a.comments ?? []).map(comment));
    add(`Anexos de "${a.title}" (acima)`, (a.attachments ?? []).map(attachment));
  }
  add('Atividades irmãs', c.siblings.map((t) => `- ${t}`));
  if (c.systemPrompt.trim()) parts.push(`## Instruções do projeto\n${block(c.systemPrompt)}`);
  return cut(parts.join('\n\n'), PROMPT_LIMIT);
}
