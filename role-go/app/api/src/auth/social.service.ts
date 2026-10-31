import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OAuth2Client } from 'google-auth-library'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export type SocialIdentity = {
  sub: string
  email: string | null
  emailVerified: boolean
  name: string | null
}

const APPLE_ISSUER = 'https://appleid.apple.com'
const appleJwks = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`))

@Injectable()
export class SocialService {
  constructor(private readonly config: ConfigService) {}

  providers() {
    const googleId = this.config.get<string>('GOOGLE_CLIENT_ID')
    const appleId = this.config.get<string>('APPLE_CLIENT_ID')
    return {
      google: googleId && this.config.get('GOOGLE_CLIENT_SECRET') ? { clientId: googleId } : null,
      apple: appleId
        ? { clientId: appleId, redirectUri: this.config.get<string>('APPLE_REDIRECT_URI') ?? '' }
        : null,
    }
  }

  async verifyGoogleCode(code: string): Promise<SocialIdentity> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID')
    const secret = this.config.get<string>('GOOGLE_CLIENT_SECRET')
    if (!clientId || !secret) {
      throw new ServiceUnavailableException('Login com Google ainda não está disponível.')
    }
    const client = new OAuth2Client(clientId, secret, 'postmessage')
    try {
      const { tokens } = await client.getToken(code)
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token!, audience: clientId })
      const p = ticket.getPayload()!
      return {
        sub: p.sub,
        email: p.email ?? null,
        emailVerified: !!p.email_verified,
        name: p.name ?? null,
      }
    } catch {
      throw new UnauthorizedException('Não foi possível validar o login com Google.')
    }
  }

  async verifyAppleIdToken(idToken: string): Promise<SocialIdentity> {
    const clientId = this.config.get<string>('APPLE_CLIENT_ID')
    if (!clientId) {
      throw new ServiceUnavailableException('Login com Apple ainda não está disponível.')
    }
    try {
      const { payload } = await jwtVerify(idToken, appleJwks, {
        issuer: APPLE_ISSUER,
        audience: clientId,
      })
      const verified = payload.email_verified
      return {
        sub: String(payload.sub),
        email: typeof payload.email === 'string' ? payload.email : null,
        emailVerified: verified === true || verified === 'true',
        name: null,
      }
    } catch {
      throw new UnauthorizedException('Não foi possível validar o login com Apple.')
    }
  }
}
