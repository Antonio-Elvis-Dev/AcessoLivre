import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import type { PublicUser } from '@acessolivre/shared'

const TOKEN_KEY = 'acessolivre.token'
const USER_KEY = 'acessolivre.user'

interface AuthState {
  token: string | null
  user: PublicUser | null
  hydrated: boolean
  hydrate: () => Promise<void>
  signIn: (token: string, user: PublicUser) => Promise<void>
  updateUser: (user: PublicUser) => Promise<void>
  signOut: () => Promise<void>
}

/** Sessão do usuário. O token fica no armazenamento seguro do aparelho. */
export const useAuth = create<AuthState>()((set) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const [token, user] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ])
      set({ token, user: user ? (JSON.parse(user) as PublicUser) : null, hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },
  signIn: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },
  updateUser: async (user) => {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
    set({ user })
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(USER_KEY)
    set({ token: null, user: null })
  },
}))
