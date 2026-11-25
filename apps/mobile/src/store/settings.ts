import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsState {
  /** Tema de alto contraste (WCAG 2.2 AA) */
  highContrast: boolean
  /** Aumenta os textos do app em 25%, além do tamanho de fonte do sistema */
  largeText: boolean
  /** Usa expressões regionais nos títulos ("Oxe, esse lugar tá acessível?") */
  regionalLanguage: boolean
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      highContrast: false,
      largeText: false,
      regionalLanguage: true,
      set: (patch) => set(patch),
    }),
    {
      name: 'acessolivre-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set: _set, ...rest }) => rest,
    },
  ),
)
