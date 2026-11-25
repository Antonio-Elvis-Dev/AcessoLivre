import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { PLACE_TYPE_LABELS, type PlaceSummary } from '@acessolivre/shared'
import { radius, spacing, TOUCH_MIN, useTheme } from '../theme'
import { formatDistance } from '../utils/geo'
import { AppText } from './AppText'
import { SealBadge, sealAccessibilityLabel } from './SealBadge'

export function PlaceCard({
  place,
  distance,
  onPress,
}: {
  place: PlaceSummary
  distance?: number
  onPress: () => void
}) {
  const { colors } = useTheme()
  const type = PLACE_TYPE_LABELS[place.type] ?? place.type
  const label = [
    place.name,
    type,
    sealAccessibilityLabel(place.seal, place.approval, place.evaluationCount),
    distance !== undefined ? `a ${formatDistance(distance)}` : null,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Abre os detalhes do local"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.flex}>
        <AppText variant="subtitle">{place.name}</AppText>
        <AppText variant="caption" muted>
          {type}
          {distance !== undefined ? ` · ${formatDistance(distance)}` : ''}
          {place.address ? ` · ${place.address}` : ''}
        </AppText>
        <SealBadge
          seal={place.seal}
          approval={place.approval}
          evaluationCount={place.evaluationCount}
          size="sm"
        />
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textMuted} accessible={false} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: TOUCH_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  flex: { flex: 1, gap: spacing.xs },
})
