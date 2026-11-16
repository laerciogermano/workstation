import type { Db } from '../../shared/db.ts';
import { conflict, notFound } from '../../shared/errors.ts';
import type { ParsedContact } from './import-parser.ts';

export type ListSummary = {
  id: string;
  name: string;
  contactCount: number;
  suppressedCount: number;
  createdAt: string;
};

export type Contact = {
  id: string;
  email: string;
  name: string | null;
  isSuppressed: boolean;
  createdAt: string;
};

type ListRow = {
  public_id: string;
  name: string;
  contact_count: string;
  suppressed_count: string;
  created_at: Date;
};

const toSummary = (r: ListRow): ListSummary => ({
  id: r.public_id,
  name: r.name,
  contactCount: Number(r.contact_count),
  suppressedCount: Number(r.suppressed_count),
  createdAt: r.created_at.toISOString(),
});

const LIST_SELECT = `
  select l.public_id, l.name, l.created_at,
         count(c.id) as contact_count,
         count(s.email) as suppressed_count
    from lists l
    left join contacts c on c.list_id = l.id
    left join suppressions s on s.email = c.email`;

const IMPORT_CHUNK = 1000;

export function createListsRepository(db: Db) {
  async function internalId(publicId: string): Promise<string> {
    const { rows } = await db.query<{ id: string }>('select id from lists where public_id = $1', [publicId]);
    if (!rows[0]) throw notFound('Lista');
    return rows[0].id;
  }

  return {
    internalId,

    async all(): Promise<ListSummary[]> {
      const { rows } = await db.query<ListRow>(`${LIST_SELECT} group by l.id order by l.created_at desc`);
      return rows.map(toSummary);
    },

    async get(publicId: string): Promise<ListSummary> {
      const { rows } = await db.query<ListRow>(`${LIST_SELECT} where l.public_id = $1 group by l.id`, [publicId]);
      if (!rows[0]) throw notFound('Lista');
      return toSummary(rows[0]);
    },

    async create(name: string): Promise<ListSummary> {
      const { rows } = await db.query<{ public_id: string }>(
        'insert into lists (name) values ($1) returning public_id',
        [name],
      );
      return this.get(rows[0]!.public_id);
    },

    async rename(publicId: string, name: string): Promise<ListSummary> {
      const { rowCount } = await db.query('update lists set name = $2 where public_id = $1', [publicId, name]);
      if (!rowCount) throw notFound('Lista');
      return this.get(publicId);
    },

    async remove(publicId: string): Promise<void> {
      const id = await internalId(publicId);
      const { rows } = await db.query<{ n: string }>('select count(*) as n from campaigns where list_id = $1', [id]);
      if (Number(rows[0]?.n) > 0) {
        throw conflict('Esta lista está ligada a campanhas. Troque a lista dessas campanhas antes de excluir.');
      }
      await db.query('delete from lists where id = $1', [id]);
    },

    async contacts(
      publicId: string,
      { search, limit, offset }: { search?: string | undefined; limit: number; offset: number },
    ): Promise<{ items: Contact[]; total: number }> {
      const id = await internalId(publicId);
      const params: unknown[] = [id];
      let filter = '';
      if (search) {
        params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
        filter = `and (c.email ilike $2 or c.name ilike $2)`;
      }
      const { rows: countRows } = await db.query<{ n: string }>(
        `select count(*) as n from contacts c where c.list_id = $1 ${filter}`,
        params,
      );
      const { rows } = await db.query<{
        public_id: string;
        email: string;
        name: string | null;
        is_suppressed: boolean;
        created_at: Date;
      }>(
        `select c.public_id, c.email, c.name, c.created_at, (s.email is not null) as is_suppressed
           from contacts c
           left join suppressions s on s.email = c.email
          where c.list_id = $1 ${filter}
          order by c.created_at desc, c.id desc
          limit $${params.length + 1} offset $${params.length + 2}`,
        [...params, limit, offset],
      );
      return {
        total: Number(countRows[0]?.n ?? 0),
        items: rows.map((r) => ({
          id: r.public_id,
          email: r.email,
          name: r.name,
          isSuppressed: r.is_suppressed,
          createdAt: r.created_at.toISOString(),
        })),
      };
    },

    /** Insere em lotes; e-mails já existentes na lista são contados como duplicados. */
    async addContacts(publicId: string, contacts: ParsedContact[]): Promise<{ added: number; alreadyInList: number }> {
      const id = await internalId(publicId);
      let added = 0;
      for (let i = 0; i < contacts.length; i += IMPORT_CHUNK) {
        const chunk = contacts.slice(i, i + IMPORT_CHUNK);
        const { rowCount } = await db.query(
          `insert into contacts (list_id, email, name)
           select $1, e, n from unnest($2::text[], $3::text[]) as t(e, n)
           on conflict (list_id, email) do nothing`,
          [id, chunk.map((c) => c.email), chunk.map((c) => c.name)],
        );
        added += rowCount ?? 0;
      }
      return { added, alreadyInList: contacts.length - added };
    },

    async removeContact(listPublicId: string, contactPublicId: string): Promise<void> {
      const id = await internalId(listPublicId);
      const { rowCount } = await db.query('delete from contacts where list_id = $1 and public_id = $2', [
        id,
        contactPublicId,
      ]);
      if (!rowCount) throw notFound('Contato');
    },
  };
}

export type ListsRepository = ReturnType<typeof createListsRepository>;
