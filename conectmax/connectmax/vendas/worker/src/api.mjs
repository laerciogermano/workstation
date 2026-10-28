/**
 * Cliente HTTP da vendas/api (fila /agente + slots).
 */
export function createApiClient({ apiUrl, apiKey }) {
  const base = String(apiUrl || '').replace(/\/$/, '');
  if (!base) throw new Error('API_URL obrigatório');

  async function json(path, opts = {}) {
    const res = await fetch(`${base}${path}`, {
      ...opts,
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
        ...(opts.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        `${path} → ${res.status} ${JSON.stringify(body)}`,
      );
    }
    return body;
  }

  return {
    claim: (agentId) =>
      json(`/agente/${encodeURIComponent(agentId)}/claim`, {
        method: 'POST',
      }),
    complete: (agentId, jobId, result) =>
      json(
        `/agente/${encodeURIComponent(agentId)}/jobs/${jobId}/complete`,
        { method: 'POST', body: JSON.stringify({ result }) },
      ),
    fail: (agentId, jobId, error) =>
      json(
        `/agente/${encodeURIComponent(agentId)}/jobs/${jobId}/fail`,
        {
          method: 'POST',
          body: JSON.stringify({ error: String(error).slice(0, 2000) }),
        },
      ),
    heartbeat: (agentId, payload) =>
      json(`/agente/${encodeURIComponent(agentId)}/heartbeat`, {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      }),
    slots: (hostKey) => {
      const q = hostKey
        ? `?hostKey=${encodeURIComponent(hostKey)}`
        : '';
      return json(`/agente/slots${q}`);
    },
    setDeviceStatus: (agentId, status) =>
      json(`/agente/${encodeURIComponent(agentId)}/device-status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
  };
}
