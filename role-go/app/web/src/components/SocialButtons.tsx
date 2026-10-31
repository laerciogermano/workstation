import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, errorMessage, type Providers, type User } from '../api/client'
import { homeFor, useAuth } from '../state/AuthContext'

type GoogleCodeResponse = { code?: string; error?: string }
type AppleSignInResponse = {
  authorization: { id_token: string }
  user?: { name?: { firstName?: string; lastName?: string } }
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (cfg: {
            client_id: string
            scope: string
            ux_mode: 'popup'
            callback: (r: GoogleCodeResponse) => void
            error_callback?: (e: { type: string }) => void
          }) => { requestCode: () => void }
        }
      }
    }
    AppleID?: {
      auth: {
        init: (cfg: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }) => void
        signIn: () => Promise<AppleSignInResponse>
      }
    }
  }
}

const GOOGLE_SDK = 'https://accounts.google.com/gsi/client'
const APPLE_SDK = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/pt_BR/appleid.auth.js'

const scripts = new Map<string, Promise<void>>()
function loadScript(src: string) {
  if (!scripts.has(src)) {
    scripts.set(
      src,
      new Promise((resolve, reject) => {
        const el = document.createElement('script')
        el.src = src
        el.async = true
        el.onload = () => resolve()
        el.onerror = () => {
          scripts.delete(src)
          reject(new Error('Não foi possível carregar o login social.'))
        }
        document.head.appendChild(el)
      }),
    )
  }
  return scripts.get(src)!
}

let providersCache: Promise<Providers> | null = null

export function SocialButtons({
  mode,
  onError,
}: {
  mode: 'signup' | 'login'
  onError: (msg: string) => void
}) {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [providers, setProviders] = useState<Providers | null>(null)
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null)

  useEffect(() => {
    providersCache ??= api.providers().catch(() => ({ google: null, apple: null }))
    providersCache.then(setProviders)
  }, [])

  function enter(user: User) {
    setUser(user)
    navigate(homeFor(user), { replace: true })
  }

  async function google() {
    onError('')
    if (!providers?.google) return onError('Login com Google ainda não está disponível.')
    setBusy('google')
    try {
      await loadScript(GOOGLE_SDK)
      const code = await new Promise<string>((resolve, reject) => {
        window
          .google!.accounts.oauth2.initCodeClient({
            client_id: providers.google!.clientId,
            scope: 'openid email profile',
            ux_mode: 'popup',
            callback: (r) => (r.code ? resolve(r.code) : reject(new Error('Login com Google cancelado.'))),
            error_callback: () => reject(new Error('Login com Google cancelado.')),
          })
          .requestCode()
      })
      enter((await api.google(code)).user)
    } catch (e) {
      onError(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  async function apple() {
    onError('')
    if (!providers?.apple) return onError('Login com Apple ainda não está disponível.')
    setBusy('apple')
    try {
      await loadScript(APPLE_SDK)
      window.AppleID!.auth.init({
        clientId: providers.apple.clientId,
        scope: 'name email',
        redirectURI: providers.apple.redirectUri || window.location.origin,
        usePopup: true,
      })
      const r = await window.AppleID!.auth.signIn().catch(() => {
        throw new Error('Login com Apple cancelado.')
      })
      const n = r.user?.name
      const name = [n?.firstName, n?.lastName].filter(Boolean).join(' ') || undefined
      enter((await api.apple(r.authorization.id_token, name)).user)
    } catch (e) {
      onError(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const label = mode === 'signup' ? 'Continuar com' : 'Login com'
  return (
    <div className="stack-gap">
      <button className="btn btn-secondary" type="button" disabled={!!busy} onClick={google}>
        {busy === 'google' ? 'Conectando…' : `${label} Google`}
      </button>
      <button className="btn btn-secondary m" type="button" disabled={!!busy} onClick={apple}>
        {busy === 'apple' ? 'Conectando…' : `${label} Apple`}
      </button>
    </div>
  )
}
