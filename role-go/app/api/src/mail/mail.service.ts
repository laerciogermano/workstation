import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createTransport, type Transporter } from 'nodemailer'

@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name)
  private readonly transport: Transporter | null

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST')
    this.transport = host
      ? createTransport({
          host,
          port: Number(config.get('SMTP_PORT') ?? 587),
          secure: Number(config.get('SMTP_PORT')) === 465,
          auth: config.get('SMTP_USER')
            ? { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') }
            : undefined,
        })
      : null
  }

  async sendPasswordReset(to: string, link: string) {
    if (!this.transport) {
      // Sem SMTP (dev): o link fica no log para testar o fluxo.
      this.log.warn(`SMTP não configurado. Link de redefinição para ${to}: ${link}`)
      return
    }
    await this.transport.sendMail({
      from: this.config.get('MAIL_FROM') ?? 'RoleGo <nao-responda@rolego.com.br>',
      to,
      subject: 'RoleGo — redefinir senha',
      text: `Recebemos um pedido para redefinir sua senha.\n\nAbra o link (válido por 1 hora):\n${link}\n\nSe não foi você, ignore este e-mail.`,
      html: `<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="${link}">Redefinir senha</a> (válido por 1 hora)</p><p>Se não foi você, ignore este e-mail.</p>`,
    })
  }
}
