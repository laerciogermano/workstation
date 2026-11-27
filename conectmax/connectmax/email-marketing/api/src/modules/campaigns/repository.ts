import type { Db } from '../../shared/db.ts';
import { withTransaction } from '../../shared/db.ts';
import { AppError, conflict, notFound } from '../../shared/errors.ts';

export type CampaignStatus = 'draft' | 'sending' | 'sent';

export type Progress = {
  total: number;
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  skipped: number;
  opened: number;
};

export type RecipientFilter = 'all' | 'opened' | 'not_opened';

export type Recipient = {
  id: string;
  email: string;
  name: string | null;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';
  sentAt: string | null;
  openedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
};

// trechos fixos: o filtro vindo da requisição só escolhe a chave
const RECIPIENT_FILTERS: Record<RecipientFilter, string> = {
  all: '',
  opened: 'and d.opened_at is not null',
  not_opened: "and d.status = 'sent' and d.opened_at is null",
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  list: { id: string; name: string } | null;
  status: CampaignStatus;
  progress: Progress;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignPatch = {
  name?: string | undefined;
  subject?: string | undefined;
  bodyHtml?: string | undefined;
  listId?: string | null | undefined;
};

type Row = {
  public_id: string;
  name: string;
  subject: string;
  body_html: string;
  status: CampaignStatus;
  list_public_id: string | null;
  list_name: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  created_at: Date;
  updated_at: Date;
  total: string;
  pending: string;
  sending: string;
  sent: string;
  failed: string;
  skipped: string;
  opened: string;
};

const SELECT = `
  select c.public_id, c.name, c.subject, c.body_html, c.status,
         c.started_at, c.finished_at, c.created_at, c.updated_at,
         l.public_id as list_public_id, l.name as list_name,
         coalesce(p.total, 0) as total, coalesce(p.pending, 0) as pending,
         coalesce(p.sending, 0) as sending, coalesce(p.sent, 0) as sent,
         coalesce(p.failed, 0) as failed, coalesce(p.skipped, 0) as skipped,
         coalesce(p.opened, 0) as opened
    from campaigns c
    left join lists l on l.id = c.list_id
    left join lateral (
      select count(*) as total,
             count(*) filter (where d.status = 'pending') as pending,
             count(*) filter (where d.status = 'sending') as sending,
             count(*) filter (where d.status = 'sent') as sent,
             count(*) filter (where d.status = 'failed') as failed,
             count(*) filter (where d.status = 'skipped') as skipped,
             count(*) filter (where d.opened_at is not null) as opened
        from deliveries d
       where d.campaign_id = c.id
    ) p on true`;

function toCampaign(r: Row, { withBody }: { withBody: boolean }): Campaign {
  return {
    id: r.public_id,
    name: r.name,
    subject: r.subject,
    bodyHtml: withBody ? r.body_html : '',
    list: r.list_public_id ? { id: r.list_public_id, name: r.list_name ?? '' } : null,
    status: r.status,
    progress: {
      total: Number(r.total),
      pending: Number(r.pending),
      sending: Number(r.sending),
      sent: Number(r.sent),
      failed: Number(r.failed),
      skipped: Number(r.skipped),
      opened: Number(r.opened),
    },
    startedAt: r.started_at?.toISOString() ?? null,
    finishedAt: r.finished_at?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export function createCampaignsRepository(db: Db) {
  return {
    async all(): Promise<Campaign[]> {
      const { rows } = await db.query<Row>(`${SELECT} order by c.created_at desc`);
      return rows.map((r) => toCampaign(r, { withBody: false }));
    },

    async get(publicId: string): Promise<Campaign> {
      const { rows } = await db.query<Row>(`${SELECT} where c.public_id = $1`, [publicId]);
      if (!rows[0]) throw notFound('Campanha');
      return toCampaign(rows[0], { withBody: true });
    },

    /** CU-06: destinatários do disparo, com quem abriu primeiro (abertura mais recente no topo). */
    async recipients(
      publicId: string,
      { filter, limit, offset }: { filter: RecipientFilter; limit: number; offset: number },
    ): Promise<{ total: number; items: Recipient[] }> {
      const { rows: found } = await db.query<{ id: string }>('select id from campaigns where public_id = $1', [publicId]);
      if (!found[0]) throw notFound('Campanha');
      const where = `where d.campaign_id = $1 ${RECIPIENT_FILTERS[filter]}`;
      const { rows: count } = await db.query<{ n: string }>(`select count(*) as n from deliveries d ${where}`, [found[0].id]);
      const { rows } = await db.query<{
        public_id: string;
        email: string;
        name: string | null;
        status: Recipient['status'];
        sent_at: Date | null;
        opened_at: Date | null;
        last_opened_at: Date | null;
        open_count: number;
      }>(
        `select d.public_id, d.email, d.name, d.status, d.sent_at, d.opened_at, d.last_opened_at, d.open_count
           from deliveries d ${where}
          order by d.last_opened_at desc nulls last, d.email
          limit $2 offset $3`,
        [found[0].id, limit, offset],
      );
      return {
        total: Number(count[0]?.n ?? 0),
        items: rows.map((r) => ({
          id: r.public_id,
          email: r.email,
          name: r.name,
          status: r.status,
          sentAt: r.sent_at?.toISOString() ?? null,
          openedAt: r.opened_at?.toISOString() ?? null,
          lastOpenedAt: r.last_opened_at?.toISOString() ?? null,
          openCount: r.open_count,
        })),
      };
    },

    async create(name: string): Promise<Campaign> {
      const { rows } = await db.query<{ public_id: string }>(
        'insert into campaigns (name) values ($1) returning public_id',
        [name],
      );
      return this.get(rows[0]!.public_id);
    },

    /** Só rascunho pode ser editado. */
    async update(publicId: string, patch: CampaignPatch): Promise<Campaign> {
      await withTransaction(db, async (tx) => {
        const { rows } = await tx.query<{ id: string; status: CampaignStatus }>(
          'select id, status from campaigns where public_id = $1 for update',
          [publicId],
        );
        const current = rows[0];
        if (!current) throw notFound('Campanha');
        if (current.status !== 'draft') throw conflict('Campanha já enviada não pode ser alterada.');

        let listId: string | null | undefined;
        if (patch.listId === null) listId = null;
        else if (patch.listId !== undefined) {
          const { rows: lists } = await tx.query<{ id: string }>('select id from lists where public_id = $1', [
            patch.listId,
          ]);
          if (!lists[0]) throw notFound('Lista');
          listId = lists[0].id;
        }

        await tx.query(
          `update campaigns
              set name = coalesce($2, name),
                  subject = coalesce($3, subject),
                  body_html = coalesce($4, body_html),
                  list_id = case when $5::boolean then $6::bigint else list_id end
            where id = $1`,
          [current.id, patch.name ?? null, patch.subject ?? null, patch.bodyHtml ?? null, listId !== undefined, listId ?? null],
        );
      });
      return this.get(publicId);
    },

    async remove(publicId: string): Promise<void> {
      const { rows } = await db.query<{ status: CampaignStatus }>('select status from campaigns where public_id = $1', [
        publicId,
      ]);
      if (!rows[0]) throw notFound('Campanha');
      if (rows[0].status !== 'draft') throw conflict('Só rascunhos podem ser excluídos.');
      await db.query("delete from campaigns where public_id = $1 and status = 'draft'", [publicId]);
    },

    /**
     * CU-04: congela os destinatários (lista atual menos descadastrados) em `deliveries`
     * e marca a campanha como `sending`, tudo na mesma transação. O worker pega daí.
     */
    async startSending(publicId: string): Promise<Campaign> {
      await withTransaction(db, async (tx) => {
        const { rows } = await tx.query<{
          id: string;
          status: CampaignStatus;
          list_id: string | null;
          subject: string;
          body_html: string;
        }>('select id, status, list_id, subject, body_html from campaigns where public_id = $1 for update', [publicId]);
        const c = rows[0];
        if (!c) throw notFound('Campanha');
        if (c.status !== 'draft') throw conflict('Esta campanha já foi disparada.');

        const missing: string[] = [];
        if (!c.subject.trim()) missing.push('assunto');
        if (!c.body_html.trim()) missing.push('conteúdo');
        if (!c.list_id) missing.push('lista');
        if (missing.length) {
          throw new AppError(400, 'incomplete', `Preencha antes de enviar: ${missing.join(', ')}.`);
        }

        const { rowCount } = await tx.query(
          `insert into deliveries (campaign_id, contact_id, email, name)
           select $1, ct.id, ct.email, ct.name
             from contacts ct
            where ct.list_id = $2
              and not exists (select 1 from suppressions s where s.email = ct.email)
           on conflict (campaign_id, email) do nothing`,
          [c.id, c.list_id],
        );
        if (!rowCount) throw new AppError(400, 'empty_list', 'A lista não tem nenhum e-mail apto a receber.');

        await tx.query("update campaigns set status = 'sending', started_at = now() where id = $1", [c.id]);
      });
      return this.get(publicId);
    },
  };
}

export type CampaignsRepository = ReturnType<typeof createCampaignsRepository>;
