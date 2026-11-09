import nodemailer from 'nodemailer';
import type { Logger } from '../logger.js';

export interface Mailer {
  send(msg: { to: string; subject: string; text: string }): Promise<void>;
}

/** Mailcow via SMTP 587 STARTTLS (ADR-007). Sem SMTP_URL em dev: registra que enviaria (sem o destinatário). */
export function createMailer(smtpUrl: string, from: string, log: Logger, isProd: boolean): Mailer {
  if (!smtpUrl) {
    return {
      async send({ subject, text }) {
        if (isProd) throw new Error('SMTP_URL ausente em produção');
        log.warn({ subject, preview: text }, 'mailer dev: e-mail não enviado (SMTP_URL vazio)');
      },
    };
  }
  const transport = nodemailer.createTransport(smtpUrl);
  return {
    async send({ to, subject, text }) {
      await transport.sendMail({ from, to, subject, text });
    },
  };
}
