/** Handlers ainda não ligados ao linkedin-agent (F3). */
export function makeStub(type) {
  return async function run(_job, _ctx) {
    if (process.env.ALLOW_STUB === '1') {
      return { ok: true, stub: true, type };
    }
    throw new Error(
      `handler ${type} não implementado (F3); ALLOW_STUB=1 para dry`,
    );
  };
}
