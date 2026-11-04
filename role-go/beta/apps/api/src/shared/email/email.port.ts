import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../env';

export type EmailMessage = { to: string; subject: string; html: string; text: string };

export abstract class EmailPort {
  abstract send(msg: EmailMessage): Promise<void>;
}

/** SMTP: Mailcow em produção, Mailpit em dev/staging (mesmo código, ADR-011). */
@Injectable()
export class SmtpEmail extends EmailPort {
  private readonly logger = new Logger('Email');
  private transporter: Transporter | null = null;

  private get t(): Transporter {
    this.transporter ??= nodemailer.createTransport({
      host: env().SMTP_HOST,
      port: env().SMTP_PORT,
      secure: env().SMTP_SECURE,
      requireTLS: env().NODE_ENV === 'production',
      ...(env().SMTP_USER ? { auth: { user: env().SMTP_USER, pass: env().SMTP_PASS } } : {}),
    });
    return this.transporter;
  }

  async send(msg: EmailMessage): Promise<void> {
    await this.t.sendMail({ from: env().MAIL_FROM, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text });
    this.logger.log(`email.sent subject="${msg.subject}"`);
  }
}

export class InMemoryEmail extends EmailPort {
  readonly outbox: EmailMessage[] = [];
  async send(msg: EmailMessage): Promise<void> {
    this.outbox.push(msg);
  }
}
