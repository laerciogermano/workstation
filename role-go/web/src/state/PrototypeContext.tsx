import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type UserProfile = {
  name: string
  email: string
  phone: string
  photoUrl: string | null
  city: string
  eventTypes: string[]
  radiusKm: number
  locationGranted: boolean
  onboarded: boolean
  loggedIn: boolean
}

type PrototypeState = {
  user: UserProfile
  updateUser: (patch: Partial<UserProfile>) => void
  logout: () => void
  resetDemo: () => void
}

const defaultUser: UserProfile = {
  name: '',
  email: '',
  phone: '',
  photoUrl: null,
  city: '',
  eventTypes: [],
  radiusKm: 20,
  locationGranted: false,
  onboarded: false,
  loggedIn: false,
}

const Ctx = createContext<PrototypeState | null>(null)

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser)

  const value = useMemo<PrototypeState>(
    () => ({
      user,
      updateUser: (patch) => setUser((u) => ({ ...u, ...patch })),
      logout: () =>
        setUser((u) => ({
          ...u,
          loggedIn: false,
          onboarded: false,
        })),
      resetDemo: () => setUser(defaultUser),
    }),
    [user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePrototype() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePrototype fora do Provider')
  return ctx
}
