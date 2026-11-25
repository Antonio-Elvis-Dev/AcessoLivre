import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native'
import { radius, spacing, TOUCH_MIN, useTheme } from '../theme'
import { AppText } from './AppText'

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string
  /** Texto lido pelo leitor de tela, se for diferente do visível */
  accessibilityLabel?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  icon?: keyof typeof Ionicons.glyphMap
  loading?: boolean
  compact?: boolean
}

export function Button({
  label,
  variant = 'primary',
  icon,
  loading,
  disabled,
  compact,
  style,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const { colors, highContrast } = useTheme()
  const isDisabled = disabled || loading

  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent'
  const fg =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'danger'
        ? highContrast
          ? '#000000'
          : '#FFFFFF'
        : variant === 'secondary'
          ? colors.primary
          : colors.text
  const borderColor =
    variant === 'secondary' ? colors.primary : variant === 'ghost' ? 'transparent' : bg

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      hitSlop={4}
      style={(state) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          opacity: isDisabled ? 0.55 : state.pressed ? 0.8 : 1,
          paddingHorizontal: compact ? spacing.md : spacing.lg,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : icon ? (
          <Ionicons name={icon} size={22} color={fg} accessible={false} />
        ) : null}
        <AppText variant="label" color={fg} style={styles.label}>
          {label}
        </AppText>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_MIN,
    minWidth: TOUCH_MIN,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { textAlign: 'center', flexShrink: 1 },
})
