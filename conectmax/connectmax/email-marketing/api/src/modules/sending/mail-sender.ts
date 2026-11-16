// Porta de saída do envio. O worker só conhece esta interface;
// SMTP (Mailpit em dev, SES/Postmark/etc. em produção) é um adaptador.
import nodemailer from 'nodemailer';

export type OutgoingMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
  messageId: string;
};

export interface MailSender {
  send(mail: OutgoingMail): Promise<void>;
  close(): Promise<void>;
}

/** Erro que não adianta repetir (endereço recusado, etc.). */
export class PermanentSendError extends Error {}

export function createSmtpMailSender(opts: {
  host: string;
  port: number;
  secure: boolean;
  user?: string | undefined;
  pass?: string | undefined;
  /** Default true. false = aceitar cert SMTP autoassinado (Mailcow Contabo). */
  tlsRejectUnauthorized?: boolean | undefined;
}): MailSender {
  const transport = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.secure,
    pool: true,
    maxConnections: 5,
    tls: { rejectUnauthorized: opts.tlsRejectUnauthorized ?? true },
    ...(opts.user ? { auth: { user: opts.user, pass: opts.pass ?? '' } } : {}),
  });

  return {
    async send(mail) {
      try {
        await transport.sendMail({
          from: mail.from,
          to: mail.to,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          headers: mail.headers,
          messageId: mail.messageId,
        });
      } catch (err) {
        const code = (err as { responseCode?: number }).responseCode;
        // 5xx = rejeição definitiva do servidor SMTP
        if (code && code >= 500 && code < 600) {
          throw new PermanentSendError((err as Error).message, { cause: err });
        }
        throw err;
      }
    },
    async close() {
      transport.close();
    },
  };
}
