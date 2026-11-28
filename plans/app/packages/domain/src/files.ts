// Arquivos que acompanham uma atividade: anexos (input e output) e comentários (output).
import { parse as parseYaml, stringify as toYaml } from 'yaml';
import { z } from 'zod';

/** attachments/<atividade>/<lado>/<arquivo> e comments/<atividade>/<comentário>.md */
export const ATTACHMENTS_DIR = 'attachments';
export const COMMENTS_DIR = 'comments';
export const SIDES = ['input', 'output'] as const;
export type Side = (typeof SIDES)[number];

export const COMMENT_MAX = 100_000;
const FILE_NAME_BYTES = 200;

/** Nome que qualquer sistema aceita: sem separador de pasta, sem começar com ponto (ficaria oculto) e curto. */
export function safeFileName(name: string): string {
  const clean = name.normalize('NFC').replace(/[\\/:*?"<>|\p{Cc}]/gu, '-').replace(/^[.\s]+|[.\s]+$/g, '');
  const ext = clean.match(/\.[^.\s]{1,16}$/)?.[0] ?? '';
  const stem = Array.from(clean.slice(0, clean.length - ext.length));
  const bytes = () => new TextEncoder().encode(stem.join('') + ext).length;
  while (stem.length && bytes() > FILE_NAME_BYTES) stem.pop();
  return stem.join('') + ext || 'arquivo';
}

export type Comment = { author: string | null; createdAt: string; text: string };

const commentHeader = z.looseObject({
  author: z.string().min(1).max(64).nullable().default(null),
  createdAt: z.string().refine((d) => !Number.isNaN(Date.parse(d))),
});

/**
 * O cabeçalho é opcional: um agente pode responder só gravando um .md na pasta da atividade.
 * Sem cabeçalho válido o arquivo inteiro é o texto, para nada ficar escondido.
 */
export function parseComment(raw: string, fallbackDate: string): Comment {
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\n$/, '');
  const m = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (m) {
    try {
      const header = commentHeader.safeParse(parseYaml(m[1]!, { schema: 'core' }));
      if (header.success) return { author: header.data.author, createdAt: header.data.createdAt, text: m[2]! };
    } catch {
      // cabeçalho que não é YAML: vale como texto
    }
  }
  return { author: null, createdAt: fallbackDate, text };
}

export function serializeComment({ author, createdAt, text }: Comment): string {
  const body = text.replace(/\r\n/g, '\n');
  return `---\n${toYaml({ author, createdAt }, { schema: 'core', lineWidth: 0 })}---\n${body}\n`;
}
