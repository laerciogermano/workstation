import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Friend = { id: string; name: string; status: 'online' | 'offline' }

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
  friends: Friend[]
  updateUser: (patch: Partial<UserProfile>) => void
  setFriends: (friends: Friend[]) => void
  logout: () => void
  resetDemo: () => void
}

const defaultFriends: Friend[] = [
  { id: '1', name: 'Maria', status: 'online' },
  { id: '2', name: 'João', status: 'online' },
  { id: '3', name: 'Ana', status: 'offline' },
  { id: '4', name: 'Pedro', status: 'online' },
]

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
  const [friends, setFriends] = useState<Friend[]>(defaultFriends)

  const value = useMemo<PrototypeState>(
    () => ({
      user,
      friends,
      updateUser: (patch) => setUser((u) => ({ ...u, ...patch })),
      setFriends,
      logout: () =>
        setUser((u) => ({
          ...u,
          loggedIn: false,
          onboarded: false,
        })),
      resetDemo: () => {
        setUser(defaultUser)
        setFriends(defaultFriends)
      },
    }),
    [user, friends],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePrototype() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePrototype fora do Provider')
  return ctx
}
