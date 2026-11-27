#!/usr/bin/env node
/**
 * Lista notas do Emissor NF-e Sebrae (MarketUP).
 *
 * Pré-req: Chrome Germano CDP :9230 logado em emissornfe.sebrae.com.br
 *   open -na "Google Chrome" --args --user-data-dir="$HOME/chrome-profiles/germano" \
 *     --remote-debugging-port=9230 --remote-allow-origins='*' https://emissornfe.sebrae.com.br/
 *
 * Uso: node sebrae-listar-notas.mjs [página]
 * Env: CDP_URL (default http://127.0.0.1:9230)
 *
 * Rollback: apagar este arquivo; listagem só via UI #/invoice.
 */
const CDP_URL = (process.env.CDP_URL || 'http://127.0.0.1:9230').replace(/\/$/, '');
const API = 'https://api-erp.emissornfe.sebrae.com.br/v1/NewInvoice/GetPagedList';
const pageNum = Number(process.argv[2] || 1);

async function cdpEval(expression) {
  const pages = await fetch(`${CDP_URL}/json/list`).then((r) => r.json());
  const page = pages.find(
    (t) => t.type === 'page' && String(t.url || '').includes('emissornfe.sebrae.com.br'),
  );
  if (!page?.webSocketDebuggerUrl) {
    throw new Error('aba emissornfe não encontrada no CDP — abra o Chrome Germano logado');
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  const result = await new Promise((resolve, reject) => {
    const id = 1;
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== id) return;
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result?.result?.value);
    });
    ws.send(
      JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true },
      }),
    );
  });
  ws.close();
  return result;
}

async function authFromCdp() {
  return cdpEval(`(() => {
    const bearer = (typeof appErp !== 'undefined' && appErp.MarketUP?.getAuthToken)
      ? appErp.MarketUP.getAuthToken()
      : null;
    let domain = null, installId = null;
    try {
      const u = JSON.parse(localStorage.getItem('UserLoginInfo') || '{}');
      domain = u.InstallDomain || null;
      installId = u.InstallID || null;
    } catch {}
    const xAuth = (domain && installId)
      ? btoa(String(domain) + ':' + String(installId))
      : null;
    return { bearer, xAuth, domain, installId };
  })()`);
}

async function main() {
  const auth = await authFromCdp();
  if (!auth?.bearer || !auth?.xAuth) {
    throw new Error(`sem token CDP: ${JSON.stringify(auth)}`);
  }

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.bearer}`,
      'x-auth-token': auth.xAuth,
    },
    body: JSON.stringify({ Page: pageNum }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('HTTP', res.status, text.slice(0, 500));
    process.exit(1);
  }

  const data = JSON.parse(text);
  console.log(
    JSON.stringify(
      {
        domain: auth.domain,
        page: data.Page,
        pageSize: data.PageSize,
        totalPages: data.TotalPages,
        totalItems: data.TotalItems,
        items: (data.Items || []).map((it) => ({
          invoiceId: it.InvoiceID,
          number: it.InvoiceNumber,
          serie: it.InvoiceSerie,
          model: it.InvoiceModel, // 1 NF-e · 2 NFC-e · 3 NFS-e
          origin: it.OriginName,
          issueDate: it.IssueDate,
          total: it.Total,
          sendStatusId: it.SendStatusID,
          destinatario: it.PersonInvoice?.OfficialName || null,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
