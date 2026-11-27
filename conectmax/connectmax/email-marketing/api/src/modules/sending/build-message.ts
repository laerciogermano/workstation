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
 * Monta o e-mail final: corpo da campanha + rodapé de descadastro + pixel de abertura.
 * List-Unsubscribe + One-Click (RFC 8058) é exigido por Gmail/Yahoo para envio em massa.
 */
export function buildMessage(d: DeliveryToSend, { from, publicBaseUrl }: { from: string; publicBaseUrl: string }): OutgoingMail {
  const baseUrl = publicBaseUrl.replace(/\/$/, '');
  const unsubscribeUrl = `${baseUrl}/u/${d.publicId}`;
  // @ fica legível no link; o resto do e-mail vai codificado
  const openUrl = `${baseUrl}/t/o/${d.publicId}.gif?e=${encodeURIComponent(d.email).replace(/%40/g, '@')}`;
  // sem display:none — alguns clientes não baixam imagem escondida
  const pixelHtml = `<img src="${escapeHtml(openUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0">`;
  const footerHtml = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #DADEE7;font:12px/1.5 Arial,sans-serif;color:#5A6377">
  Você recebeu este e-mail da Connect. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0070BC">Não quero mais receber</a>.
</div>`;
  const tail = `${footerHtml}\n${pixelHtml}`;
  // função no replace: um "$" no e-mail ou no HTML não vira padrão de substituição
  const html = /<\/body>/i.test(d.bodyHtml)
    ? d.bodyHtml.replace(/<\/body>/i, () => `${tail}</body>`)
    : `${d.bodyHtml}${tail}`;
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
