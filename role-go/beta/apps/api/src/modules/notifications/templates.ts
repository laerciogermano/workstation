import { escapeHtml } from '../../shared/kernel/format';
import type { EmailMessage } from '../../shared/email/email.port';

/** Templates transacionais (pt-BR). Layout escuro da marca, CTA em gradiente; texto puro como alternativa. */
function layout(title: string, body: string, cta?: { label: string; url: string }): { html: string; text: string } {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${escapeHtml(cta.url)}" style="background:linear-gradient(90deg,#00E5E5,#8749FF);color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px;display:inline-block">${escapeHtml(cta.label)}</a></p>`
    : '';
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#04050B;font-family:Poppins,Arial,sans-serif;color:#fff">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#000;border:1px solid #1E1E25;border-radius:16px">
<tr><td style="padding:28px 28px 8px"><span style="font-weight:800;font-style:italic;font-size:24px">Role<span style="color:#8749FF">Go</span></span></td></tr>
<tr><td style="padding:8px 28px 28px;line-height:1.6;color:#C9CDD8;font-size:15px">
<h1 style="color:#fff;font-size:20px;font-style:italic;text-transform:uppercase;margin:12px 0 16px">${escapeHtml(title)}</h1>
${body}${button}
<p style="color:#6B7286;font-size:12px;margin-top:28px">Você recebeu este e-mail porque tem conta no RoleGo. Viva o Rolê.</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${title}\n\n${body.replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim()}${cta ? `\n\n${cta.label}: ${cta.url}` : ''}\n\n— RoleGo`;
  return { html, text };
}

const p = (s: string) => `<p>${s}</p>`;
type Vars = Record<string, string>;
const v = (vars: Vars, k: string) => escapeHtml(vars[k] ?? '');

export const TEMPLATES = {
  verify_email: (x: Vars) => ({ subject: 'Confirme seu e-mail no RoleGo', ...layout('Confirme seu e-mail', p(`Oi, ${v(x, 'name')}! Falta só confirmar seu e-mail. O link vale 24 horas.`), { label: 'Confirmar e-mail', url: x['url'] ?? '' }) }),
  reset_password: (x: Vars) => ({ subject: 'Redefinir sua senha do RoleGo', ...layout('Redefinir senha', p('Recebemos um pedido para redefinir sua senha. O link vale 1 hora e só pode ser usado uma vez. Se não foi você, ignore este e-mail.'), { label: 'Criar nova senha', url: x['url'] ?? '' }) }),
  rsvp_confirmed: (x: Vars) => ({ subject: `Você vai! ${x['title'] ?? ''}`, ...layout('Você vai!', p(`Presença confirmada em <b style="color:#fff">${v(x, 'title')}</b>.`) + p(`${v(x, 'when')} · ${v(x, 'place')}`), { label: 'Ver o rolê', url: x['url'] ?? '' }) }),
  rsvp_approved: (x: Vars) => ({ subject: `Você entrou na lista: ${x['title'] ?? ''}`, ...layout('Você está na lista', p(`O anfitrião aprovou seu pedido para <b style="color:#fff">${v(x, 'title')}</b>.`) + p(`${v(x, 'when')}`) + p(`Endereço: <b style="color:#fff">${v(x, 'address')}</b>`), { label: 'Ver o rolê', url: x['url'] ?? '' }) }),
  rsvp_declined: (x: Vars) => ({ subject: `Atualização do seu pedido: ${x['title'] ?? ''}`, ...layout('Pedido não aprovado', p(`Desta vez o anfitrião não aprovou seu pedido para <b style="color:#fff">${v(x, 'title')}</b>. Tem muito rolê rolando perto de você.`), { label: 'Explorar rolês', url: x['exploreUrl'] ?? '' }) }),
  event_changed: (x: Vars) => ({ subject: `Mudou: ${x['title'] ?? ''}`, ...layout('O rolê mudou', p(`<b style="color:#fff">${v(x, 'title')}</b> teve mudança de data, horário ou local.`) + p(`Agora: ${v(x, 'when')} · ${v(x, 'place')}`), { label: 'Ver detalhes', url: x['url'] ?? '' }) }),
  event_cancelled: (x: Vars) => ({ subject: `Cancelado: ${x['title'] ?? ''}`, ...layout('Rolê cancelado', p(`O organizador cancelou <b style="color:#fff">${v(x, 'title')}</b>.`) + p(`Motivo: ${v(x, 'reason')}`), { label: 'Explorar outros rolês', url: x['exploreUrl'] ?? '' }) }),
  review_invite: (x: Vars) => ({ subject: `Como foi ${x['title'] ?? 'o rolê'}?`, ...layout('Como foi?', p(`Conta pra gente como foi <b style="color:#fff">${v(x, 'title')}</b>. Leva 10 segundos e ajuda quem vai na próxima.`), { label: 'Avaliar', url: x['url'] ?? '' }) }),
} as const;

export type TemplateName = keyof typeof TEMPLATES;
export const isTemplate = (t: unknown): t is TemplateName => typeof t === 'string' && t in TEMPLATES;

export function render(name: TemplateName, to: string, vars: Vars): EmailMessage {
  const t = TEMPLATES[name](vars);
  return { to, subject: t.subject, html: t.html, text: t.text };
}
