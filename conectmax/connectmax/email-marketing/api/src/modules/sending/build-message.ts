import type { OutgoingMail } from './mail-sender.ts';

export type DeliveryToSend = {
  publicId: string;
  email: string;
  subject: string;
  bodyHtml: string;
};

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Monta o e-mail final: corpo da campanha + rodapé de descadastro.
 * List-Unsubscribe + One-Click (RFC 8058) é exigido por Gmail/Yahoo para envio em massa.
 */
export function buildMessage(d: DeliveryToSend, { from, publicBaseUrl }: { from: string; publicBaseUrl: string }): OutgoingMail {
  const unsubscribeUrl = `${publicBaseUrl.replace(/\/$/, '')}/u/${d.publicId}`;
  const footerHtml = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #DADEE7;font:12px/1.5 Arial,sans-serif;color:#5A6377">
  Você recebeu este e-mail da Connect. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0070BC">Não quero mais receber</a>.
</div>`;
  const html = /<\/body>/i.test(d.bodyHtml)
    ? d.bodyHtml.replace(/<\/body>/i, `${footerHtml}</body>`)
    : `${d.bodyHtml}${footerHtml}`;
  const text = `${htmlToText(d.bodyHtml)}\n\n—\nPara não receber mais: ${unsubscribeUrl}`;
  const domain = from.match(/@([^>\s]+)/)?.[1] ?? 'connect.local';

  return {
    from,
    to: d.email,
    subject: d.subject,
    html,
    text,
    // Message-ID estável por entrega: reenvio após falha não vira e-mail "novo" para o provedor
    messageId: `<${d.publicId}@${domain}>`,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}
