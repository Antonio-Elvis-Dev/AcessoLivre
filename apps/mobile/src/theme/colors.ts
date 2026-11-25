/**
 * Paleta inspirada no sertão e no cordel (barro, ocre, mandacaru), com contraste
 * mínimo de 4,5:1 para texto (WCAG 2.2 AA). O tema de alto contraste usa fundo
 * preto e texto branco/amarelo, com contraste acima de 7:1.
 */
import type { SealLevel } from '@acessolivre/shared'

export interface Palette {
  background: string
  surface: string
  surfaceAlt: string
  text: string
  textMuted: string
  primary: string
  onPrimary: string
  accent: string
  border: string
  focus: string
  danger: string
  success: string
  seal: Record<SealLevel, string>
  /** Cor do texto sobre a cor do selo */
  onSeal: string
}

export const defaultPalette: Palette = {
  background: '#FFF8EC', // papel de cordel
  surface: '#FFFFFF',
  surfaceAlt: '#F6EBD9',
  text: '#2B1D14', // tinta de xilogravura
  textMuted: '#5C4A3D',
  primary: '#9A3412', // barro / terracota (7,0:1 sobre branco)
  onPrimary: '#FFFFFF',
  accent: '#1F5F3F', // mandacaru
  border: '#8C7A6B',
  focus: '#1D4ED8',
  danger: '#B3261E',
  success: '#1B7F3B',
  seal: {
    acessivel: '#1B7F3B',
    parcial: '#8A5A00',
    pouco_acessivel: '#B3261E',
    poucas_avaliacoes: '#5F6368',
  },
  onSeal: '#FFFFFF',
}

export const highContrastPalette: Palette = {
  background: '#000000',
  surface: '#000000',
  surfaceAlt: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#FFFFFF',
  primary: '#FFD600',
  onPrimary: '#000000',
  accent: '#FFD600',
  border: '#FFFFFF',
  focus: '#00E5FF',
  danger: '#FF8A80',
  success: '#69F0AE',
  seal: {
    acessivel: '#69F0AE',
    parcial: '#FFD600',
    pouco_acessivel: '#FF8A80',
    poucas_avaliacoes: '#E0E0E0',
  },
  onSeal: '#000000',
}
