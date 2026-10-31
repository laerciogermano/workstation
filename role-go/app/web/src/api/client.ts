// Cliente da RoleGo API (Nest). Sessão em cookie httpOnly; o Vite faz proxy de /api.
export type User = {
  id: string
  email: string
  name: string
  photoUrl: string | null
  hasPassword: boolean
  providers: { google: boolean; apple: boolean }
  eventTypes: string[]
  city: string | null
  locationGranted: boolean
  radiusKm: number
  onboarded: boolean
}

export type Providers = {
  google: { clientId: string } | null
  apple: { clientId: string; redirectUri: string } | null
}

export type Preferences = Partial<
  Pick<User, 'eventTypes' | 'city' | 'locationGranted' | 'radiusKm'> & {
    latitude: number | null
    longitude: number | null
  }
>

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Tente de novo.')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message[0] : data.message
    const fallback =
      res.status === 429 ? 'Muitas tentativas. Aguarde um pouco.' : 'Algo deu errado. Tente de novo.'
    throw new ApiError(res.status, msg || fallback)
  }
  return data as T
}

type Session = { user: User }

export const api = {
  me: () => call<User>('GET', '/me'),
  providers: () => call<Providers>('GET', '/auth/providers'),
  register: (email: string, password: string, confirmPassword: string) =>
    call<Session>('POST', '/auth/register', { email, password, confirmPassword }),
  login: (email: string, password: string) => call<Session>('POST', '/auth/login', { email, password }),
  google: (code: string) => call<Session>('POST', '/auth/google', { code }),
  apple: (idToken: string, name?: string) => call<Session>('POST', '/auth/apple', { idToken, name }),
  forgotPassword: (email: string) => call<void>('POST', '/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string, confirmPassword: string) =>
    call<Session>('POST', '/auth/reset-password', { token, password, confirmPassword }),
  logout: () => call<void>('POST', '/auth/logout'),
  updateProfile: (patch: { name?: string; email?: string }) => call<User>('PATCH', '/me', patch),
  updatePreferences: (patch: Preferences) => call<User>('PATCH', '/me/preferences', patch),
  completeOnboarding: () => call<User>('POST', '/me/onboarding/complete'),
  uploadPhoto: (file: File) => {
    const form = new FormData()
    form.append('photo', file)
    return call<User>('PUT', '/me/photo', form)
  },
  deletePhoto: () => call<User>('DELETE', '/me/photo'),
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.'
