const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const DEFAULT_MS = 12_000;

export async function fetchText(url, { timeoutMs = DEFAULT_MS, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        ...headers,
      },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, url: res.url, text };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJson(url, { timeoutMs = DEFAULT_MS, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        ...headers,
      },
    });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    try {
      return { ok: true, status: res.status, data: await res.json() };
    } catch {
      return { ok: false, status: res.status, data: null };
    }
  } finally {
    clearTimeout(t);
  }
}
