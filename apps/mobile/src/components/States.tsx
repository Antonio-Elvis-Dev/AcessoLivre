import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { spacing, useTheme } from '../theme'
import { AppText } from './AppText'
import { Button } from './Button'

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  const { colors } = useTheme()
  return (
    <View
      style={styles.center}
      accessible
      accessibilityLabel={label}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText muted>{label}</AppText>
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme()
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <Ionicons
        name="cloud-offline-outline"
        size={48}
        color={colors.textMuted}
        accessible={false}
      />
      <AppText style={styles.text}>{message}</AppText>
      {onRetry ? <Button label="Tentar de novo" icon="refresh" onPress={onRetry} /> : null}
    </View>
  )
}

export function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={styles.center}>
      <Ionicons name="map-outline" size={48} color={colors.textMuted} accessible={false} />
      <AppText style={styles.text}>{message}</AppText>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  text: { textAlign: 'center' },
})
