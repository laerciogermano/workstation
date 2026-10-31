import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { IsNull, MoreThan, Repository } from 'typeorm'
import { MailService } from '../mail/mail.service'
import { PasswordReset } from '../users/password-reset.entity'
import { User } from '../users/user.entity'
import { normalizeEmail, UsersService } from '../users/users.service'
import { SESSION_TTL_S, type SessionPayload } from './session'
import type { SocialIdentity } from './social.service'

const RESET_TTL_MS = 60 * 60 * 1000
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
// hash fixo para comparar mesmo quando o e-mail não existe (tempo constante)
const DUMMY_HASH = bcrypt.hashSync('rolego-dummy-password', 10)

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name)

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    @InjectRepository(PasswordReset) private readonly resets: Repository<PasswordReset>,
  ) {}

  sign(user: User) {
    const payload: SessionPayload = { sub: user.id, v: user.tokenVersion }
    return this.jwt.signAsync(payload, { expiresIn: SESSION_TTL_S })
  }

  private assertConfirm(password: string, confirm: string) {
    if (password !== confirm) throw new BadRequestException('Confirmação de senha não confere.')
  }

  async register(email: string, password: string, confirm: string) {
    this.assertConfirm(password, confirm)
    return this.users.create({ email, passwordHash: await bcrypt.hash(password, 10) })
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email)
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
    if (!user || !user.passwordHash || !ok) {
      throw new UnauthorizedException('E-mail ou senha incorretos.')
    }
    return user
  }

  // Google/Apple: acha pela conta social; senão vincula pelo e-mail verificado; senão cria.
  async socialLogin(provider: 'google' | 'apple', id: SocialIdentity, name?: string) {
    const key = provider === 'google' ? 'googleSub' : 'appleSub'
    const linked = await this.users.findBySocial(key, id.sub)
    if (linked) return linked

    if (!id.email || !id.emailVerified) {
      throw new UnauthorizedException('A conta social não informou um e-mail verificado.')
    }
    const byEmail = await this.users.findByEmail(id.email)
    if (byEmail) return this.users.update(byEmail, { [key]: id.sub })

    return this.users.create({ email: id.email, name: name ?? id.name ?? '', [key]: id.sub })
  }

  // Sempre responde igual (não revela se o e-mail tem conta).
  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email)
    if (!user) {
      this.log.log(`Redefinição pedida para e-mail sem conta: ${normalizeEmail(email)}`)
      return
    }
    const token = randomBytes(32).toString('base64url')
    await this.resets.save(
      this.resets.create({
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      }),
    )
    const base = this.config.get<string>('APP_URL') ?? 'http://localhost:5173'
    await this.mail.sendPasswordReset(user.email, `${base}/redefinir-senha?token=${token}`)
  }

  async resetPassword(token: string, password: string, confirm: string) {
    this.assertConfirm(password, confirm)
    const reset = await this.resets.findOneBy({
      tokenHash: sha256(token),
      usedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    })
    if (!reset) throw new BadRequestException('Link inválido ou expirado. Peça um novo.')
    const user = await this.users.getOrFail(reset.userId)
    reset.usedAt = new Date()
    await this.resets.save(reset)
    return this.users.update(user, {
      passwordHash: await bcrypt.hash(password, 10),
      tokenVersion: user.tokenVersion + 1,
    })
  }
}
