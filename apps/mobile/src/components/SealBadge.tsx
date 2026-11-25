import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { formatApproval, SEAL_INFO, type SealLevel } from '@acessolivre/shared'
import { useSettings } from '../store/settings'
import { radius, spacing, useTheme } from '../theme'
import { AppText } from './AppText'

const ICONS: Record<SealLevel, keyof typeof Ionicons.glyphMap> = {
  acessivel: 'checkmark-circle',
  parcial: 'alert-circle',
  pouco_acessivel: 'close-circle',
  poucas_avaliacoes: 'help-circle',
}

export function sealAccessibilityLabel(seal: SealLevel, approval: number | null, count: number) {
  const info = SEAL_INFO[seal]
  const pct = seal === 'poucas_avaliacoes' ? '' : `, ${formatApproval(approval)} de aprovação`
  return `Selo: ${info.label}${pct}, ${count} ${count === 1 ? 'avaliação' : 'avaliações'}`
}

/**
 * Selo de acessibilidade (RF03). Cor, ícone e texto juntos: a cor nunca é a única
 * informação, para quem não distingue cores.
 */
export function SealBadge({
  seal,
  approval,
  evaluationCount,
  size = 'md',
}: {
  seal: SealLevel
  approval: number | null
  evaluationCount: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const { colors } = useTheme()
  const regional = useSettings((s) => s.regionalLanguage)
  const info = SEAL_INFO[seal]
  const bg = colors.seal[seal]
  const showPct = seal !== 'poucas_avaliacoes' && approval !== null

  if (size === 'lg') {
    return (
      <View
        accessible
        accessibilityLabel={sealAccessibilityLabel(seal, approval, evaluationCount)}
        style={[styles.large, { backgroundColor: bg }]}
      >
        <Ionicons name={ICONS[seal]} size={44} color={colors.onSeal} />
        <View style={styles.flex}>
          <AppText variant="subtitle" color={colors.onSeal}>
            {info.label}
            {showPct ? ` · ${formatApproval(approval)}` : ''}
          </AppText>
          {regional ? (
            <AppText variant="label" color={colors.onSeal}>
              {info.regional}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.onSeal}>
            {info.description} {evaluationCount}{' '}
            {evaluationCount === 1 ? 'avaliação' : 'avaliações'}.
          </AppText>
        </View>
      </View>
    )
  }

  return (
    <View
      accessible
      accessibilityLabel={sealAccessibilityLabel(seal, approval, evaluationCount)}
      style={[styles.pill, { backgroundColor: bg }]}
    >
      <Ionicons name={ICONS[seal]} size={size === 'sm' ? 16 : 20} color={colors.onSeal} />
      <AppText variant={size === 'sm' ? 'caption' : 'label'} color={colors.onSeal}>
        {info.label}
        {showPct ? ` · ${formatApproval(approval)}` : ''}
      </AppText>
    </View>
  )
}

export { ICONS as SEAL_ICONS }

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  large: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  flex: { flex: 1, gap: 2 },
})
