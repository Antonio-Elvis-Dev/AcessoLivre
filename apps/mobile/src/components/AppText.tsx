import { Text, type TextProps } from 'react-native'
import { useTheme } from '../theme'

type Variant = 'title' | 'subtitle' | 'body' | 'label' | 'caption'

const SIZES: Record<Variant, { size: number; weight: '400' | '600' | '700' }> = {
  title: { size: 24, weight: '700' },
  subtitle: { size: 19, weight: '700' },
  body: { size: 16, weight: '400' },
  label: { size: 16, weight: '600' },
  caption: { size: 14, weight: '400' },
}

export interface AppTextProps extends TextProps {
  variant?: Variant
  muted?: boolean
  color?: string
}

/** Texto do app: respeita o tamanho de fonte do sistema e a opção "texto maior". */
export function AppText({ variant = 'body', muted, color, style, ...props }: AppTextProps) {
  const { colors, font } = useTheme()
  const s = SIZES[variant]
  return (
    <Text
      {...props}
      accessibilityRole={props.accessibilityRole ?? (variant === 'title' ? 'header' : undefined)}
      style={[
        {
          color: color ?? (muted ? colors.textMuted : colors.text),
          fontSize: font(s.size),
          lineHeight: Math.round(font(s.size) * 1.4),
          fontWeight: s.weight,
        },
        style,
      ]}
    />
  )
}
