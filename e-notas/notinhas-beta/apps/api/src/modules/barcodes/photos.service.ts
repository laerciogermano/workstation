import type { PhotoRegistrationTallyDTO, SetProductPhotoResultDTO } from '@notinhas/contracts';
import type { Db, Queryable } from '../../shared/db.js';
import { withTx } from '../../shared/db.js';
import type { Owner } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';

/** Contagens por URL + principal (mais votos; empate = registro mais recente). */
export async function photoTallies(
  db: Queryable,
  gtin: string,
): Promise<{ primaryUrl: string | null; registrations: PhotoRegistrationTallyDTO[] }> {
  const { rows } = await db.query<{ photo_url: string; votes: string; last_at: Date }>(
    `SELECT photo_url, count(*)::text AS votes, max(created_at) AS last_at
     FROM photo_registrations
     WHERE gtin = $1
     GROUP BY photo_url
     ORDER BY count(*) DESC, max(created_at) DESC, photo_url ASC`,
    [gtin],
  );
  const primaryUrl = rows[0]?.photo_url ?? null;
  return {
    primaryUrl,
    registrations: rows.map((r) => ({
      url: r.photo_url,
      votes: Number(r.votes),
      primary: r.photo_url === primaryUrl,
    })),
  };
}

/** Aplica a URL mais votada em products.photo_url (fonte do índice / cards). */
async function upsertPrimaryPhoto(tx: Queryable, gtin: string, url: string): Promise<void> {
  await tx.query('UPDATE products SET photo_url = $2, updated_at = now() WHERE gtin = $1', [gtin, url]);
}

/**
 * Cada escolha no picker é um voto em photo_registrations.
 * A foto ativa (products.photo_url) = mais repetida; empate → voto mais recente.
 */
export async function registerPhotoVote(
  deps: { db: Db },
  input: { gtin: string; url: string; source?: string | null },
  owner: Owner | null,
): Promise<SetProductPhotoResultDTO> {
  const { db } = deps;
  const has = await db.query('SELECT 1 FROM products WHERE gtin = $1', [input.gtin]);
  if (!has.rowCount) throw new AppError('NOT_FOUND');

  return withTx(db, async (tx) => {
    const before = await tx.query<{ photo_url: string | null }>(
      'SELECT photo_url FROM products WHERE gtin = $1 FOR UPDATE',
      [input.gtin],
    );
    const prevPrimary = before.rows[0]?.photo_url ?? null;

    await tx.query(
      `INSERT INTO photo_registrations (gtin, photo_url, source, linked_by_visitor_id, linked_by_user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.gtin, input.url, input.source ?? 'picker', owner?.visitorId ?? null, owner?.userId ?? null],
    );

    const tallies = await photoTallies(tx, input.gtin);
    const primaryUrl = tallies.primaryUrl;
    if (!primaryUrl) throw new AppError('INTERNAL', 'Falha ao calcular foto principal.');

    await upsertPrimaryPhoto(tx, input.gtin, primaryUrl);

    let status: SetProductPhotoResultDTO['status'];
    if (!prevPrimary) status = 'set';
    else if (prevPrimary !== primaryUrl) status = 'primary_changed';
    else status = 'registered';

    return {
      ok: true,
      status,
      primaryUrl,
      registrations: tallies.registrations,
    };
  });
}
