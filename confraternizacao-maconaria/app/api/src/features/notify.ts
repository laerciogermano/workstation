import type { Queryable } from '../database.js';

export async function notify(q: Queryable, attendeeIds: string[], title: string, body: string, target: string) {
  if (!attendeeIds.length) return;
  await q.many('insert into notifications (attendee_id, title, body, target) select unnest($1::uuid[]), $2, $3, $4', [attendeeIds, title, body, target]);
}
