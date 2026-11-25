import { Pressable, StyleSheet } from 'react-native'
import { radius, spacing, TOUCH_MIN, useTheme } from '../theme'
import { AppText } from './AppText'

/** Filtro liga/desliga. Anuncia "selecionado" ao leitor de tela. */
export function Chip({
  label,
  selected,
  onPress,
  accessibilityHint,
}: {
  label: string
  selected: boolean
  onPress: () => void
  accessibilityHint?: string
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText variant="label" color={selected ? colors.onPrimary : colors.text}>
        {selected ? '✓ ' : ''}
        {label}
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    minHeight: TOUCH_MIN,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
})
