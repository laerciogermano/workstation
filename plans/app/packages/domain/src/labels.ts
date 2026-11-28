// Etiquetas dos cartões: o catálogo fica em labels.json, na raiz da pasta; o cartão guarda só os ids.
import { z } from 'zod';

export const LABELS_FILE = 'labels.json';
export const LABEL_NAME_MAX = 40;

/** Cores fixas, para as categorias ficarem consistentes; o tom na tela acompanha o tema. */
export const LABEL_COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'gray'] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];
export const LABEL_COLOR_NAME: Record<LabelColor, string> = {
  red: 'Vermelho', orange: 'Laranja', yellow: 'Amarelo', green: 'Verde', teal: 'Turquesa', blue: 'Azul', purple: 'Roxo', pink: 'Rosa', gray: 'Cinza',
};

export const labelNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o nome da etiqueta')
  .max(LABEL_NAME_MAX, `Nome de etiqueta com no máximo ${LABEL_NAME_MAX} caracteres`)
  .refine((n) => !/[\r\n]/.test(n), 'Nome em uma linha só');

export const labelSchema = z.object({ id: z.string().min(1).max(64), name: labelNameSchema, color: z.enum(LABEL_COLORS) });
export type Label = z.infer<typeof labelSchema>;
export const labelsSchema = z.object({ version: z.literal(1), items: z.array(labelSchema) });

const plain = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
/** "Revisão" e "revisao" são a mesma categoria. */
export const sameLabelName = (a: string, b: string) => plain(a) === plain(b);

/** Id legível a partir do nome, sem repetir os já usados. Não muda quando a etiqueta é renomeada. */
export function newLabelId(name: string, used: string[]): string {
  const base = plain(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'etiqueta';
  let id = base;
  for (let n = 2; used.includes(id); n++) id = `${base}-${n}`;
  return id;
}

/** As etiquetas do cartão, na ordem do catálogo; id que não está no catálogo fica de fora. */
export const labelsOf = (ids: string[] | undefined, catalog: Label[]): Label[] => catalog.filter((l) => ids?.includes(l.id));
