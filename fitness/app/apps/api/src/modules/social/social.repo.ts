import type { FeedPost, MyCharacter } from '@fitness/contracts';
import { DEFAULT_SHARE, type PostKind, type ShareSettings } from '@fitness/domain';
import type { Queryable } from '../../shared/db';

export interface CharacterRow {
  id: string;
  device_id: string;
  nick: string;
  color: number;
  gym_id: string | null;
  opt_in: boolean;
  share: Partial<ShareSettings>;
  hide_history: boolean;
}

const CHAR_COLS = 'id, device_id, nick, color, gym_id, opt_in, share, hide_history';

export const shareOf = (row: Pick<CharacterRow, 'share'>): ShareSettings => ({ ...DEFAULT_SHARE, ...row.share });

export async function findCharacterByDevice(db: Queryable, deviceId: string): Promise<CharacterRow | null> {
  const r = await db.query<CharacterRow>(`SELECT ${CHAR_COLS} FROM characters WHERE device_id = $1`, [deviceId]);
  return r.rows[0] ?? null;
}

export async function findCharacterByNick(db: Queryable, nick: string): Promise<CharacterRow | null> {
  const r = await db.query<CharacterRow>(`SELECT ${CHAR_COLS} FROM characters WHERE nick = $1`, [nick]);
  return r.rows[0] ?? null;
}

export async function findMyCharacter(db: Queryable, deviceId: string): Promise<MyCharacter | null> {
  const c = await findCharacterByDevice(db, deviceId);
  if (!c) return null;
  const n = await db.query<{ n: string }>(`SELECT count(*) AS n FROM posts WHERE character_id = $1`, [c.id]);
  return {
    nick: c.nick,
    color: c.color,
    gymId: c.gym_id,
    optIn: c.opt_in,
    share: shareOf(c),
    hideHistory: c.hide_history,
    postCount: Number(n.rows[0]?.n ?? 0),
  };
}

export async function insertPost(
  db: Queryable,
  characterId: string,
  p: { kind: PostKind; title: string; values: [string, string][]; pr?: string | null; achievement?: string | null },
): Promise<void> {
  await db.query(`INSERT INTO posts (character_id, kind, title, vals, pr, achievement) VALUES ($1,$2,$3,$4,$5,$6)`, [
    characterId,
    p.kind,
    p.title,
    JSON.stringify(p.values),
    p.pr ?? null,
    p.achievement ?? null,
  ]);
}

interface PostRow {
  id: string;
  nick: string;
  color: number;
  gym_id: string | null;
  gym_name: string | null;
  kind: PostKind;
  title: string;
  vals: [string, string][];
  pr: string | null;
  achievement: string | null;
  created_at: Date;
  kudos: string;
  kudoed: boolean;
  mine: boolean;
}

/**
 * Feed visível (RN-17): personagem com vitrine ligada, ou desligada sem ocultar o histórico.
 * `$1` = aparelho de quem lê (para kudoed/mine).
 */
export async function queryFeed(
  db: Queryable,
  viewer: string,
  filter: { gymId?: string; characterId?: string; limit?: number },
): Promise<FeedPost[]> {
  const params: unknown[] = [viewer];
  const where = ['(c.opt_in OR NOT c.hide_history)'];
  if (filter.gymId) {
    params.push(filter.gymId);
    where.push(`c.gym_id = $${params.length}`);
  }
  if (filter.characterId) {
    params.push(filter.characterId);
    where.push(`c.id = $${params.length}`);
  }
  params.push(filter.limit ?? 50);
  const r = await db.query<PostRow>(
    `SELECT p.id, c.nick, c.color, c.gym_id, g.name AS gym_name, p.kind, p.title, p.vals, p.pr, p.achievement,
            p.created_at,
            (SELECT count(*) FROM kudos k WHERE k.post_id = p.id) AS kudos,
            EXISTS (SELECT 1 FROM kudos k WHERE k.post_id = p.id AND k.device_id = $1) AS kudoed,
            (c.device_id = $1) AS mine
       FROM posts p
       JOIN characters c ON c.id = p.character_id
       LEFT JOIN gyms g ON g.id = c.gym_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT $${params.length}`,
    params,
  );
  return r.rows.map((x) => ({
    id: x.id,
    nick: x.nick,
    color: x.color,
    gymId: x.gym_id,
    gymName: x.gym_name,
    kind: x.kind,
    title: x.title,
    values: x.vals,
    pr: x.pr,
    achievement: x.achievement,
    createdAt: x.created_at.toISOString(),
    kudos: Number(x.kudos),
    kudoed: x.kudoed,
    mine: x.mine,
  }));
}
