/**
 * Injeta `X-Api-Key` (AGENT_API_KEY) em todo fetch para a vendas/api.
 * Chamar no início dos scripts que falam com a API.
 */
export function installConnectmaxApiAuth() {
  const key = String(process.env.AGENT_API_KEY || '').trim();
  if (!key || globalThis.__cxApiAuthInstalled) return;
  globalThis.__cxApiAuthInstalled = true;
  const orig = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (!headers.has('x-api-key') && !headers.has('X-Api-Key')) {
      headers.set('x-api-key', key);
    }
    return orig(input, { ...init, headers });
  };
}
