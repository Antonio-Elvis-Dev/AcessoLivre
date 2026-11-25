import { StyleSheet, View } from 'react-native'
import { formatApproval, sealLevel } from '@acessolivre/shared'
import { radius, spacing, useTheme } from '../theme'
import { AppText } from './AppText'

/** Barra de aprovação de uma categoria, com o percentual escrito ao lado. */
export function CategoryBar({
  name,
  approval,
  answers,
}: {
  name: string
  approval: number | null
  answers: number
}) {
  const { colors } = useTheme()
  const level = approval === null ? 'poucas_avaliacoes' : sealLevel(approval, Infinity)
  const color = colors.seal[level]
  const text = approval === null ? 'sem respostas' : formatApproval(approval)
  return (
    <View
      accessible
      accessibilityLabel={`${name}: ${approval === null ? 'ainda sem respostas' : `${text} de aprovação, ${answers} respostas`}`}
      style={styles.wrap}
    >
      <View style={styles.header}>
        <AppText variant="label">{name}</AppText>
        <AppText variant="label" muted={approval === null}>
          {text}
        </AppText>
      </View>
      <View
        style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        {approval !== null ? (
          <View
            style={[
              styles.fill,
              { width: `${Math.max(4, approval * 100)}%`, backgroundColor: color },
            ]}
          />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  track: { height: 12, borderRadius: radius.pill, overflow: 'hidden', borderWidth: 1 },
  fill: { height: '100%' },
})
