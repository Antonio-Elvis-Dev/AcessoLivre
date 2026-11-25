import { useMemo } from 'react'
import { useSettings } from '../store/settings'
import { defaultPalette, highContrastPalette, type Palette } from './colors'

/** Área mínima de toque. A WCAG pede 44 px; usamos 48 para dar folga a quem tem tremor. */
export const TOUCH_MIN = 48

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const

export interface Theme {
  colors: Palette
  highContrast: boolean
  /** Multiplicador extra de fonte escolhido no app (além do tamanho do sistema). */
  fontScale: number
  font: (size: number) => number
}

export function useTheme(): Theme {
  const highContrast = useSettings((s) => s.highContrast)
  const largeText = useSettings((s) => s.largeText)
  return useMemo(() => {
    const fontScale = largeText ? 1.25 : 1
    return {
      colors: highContrast ? highContrastPalette : defaultPalette,
      highContrast,
      fontScale,
      font: (size: number) => Math.round(size * fontScale),
    }
  }, [highContrast, largeText])
}

export type { Palette }
