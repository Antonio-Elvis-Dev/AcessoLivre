import { Pressable, StyleSheet, View } from 'react-native'
import { ANSWER_LABELS, ANSWER_VALUES, type AnswerValue } from '@acessolivre/shared'
import { radius, spacing, TOUCH_MIN, useTheme } from '../theme'
import { AppText } from './AppText'

/**
 * Pergunta com resposta Sim / Não / Não sei (RF02), como grupo de botões de rádio
 * acessível: cada opção anuncia "marcado" e a posição no grupo.
 */
export function AnswerSelector({
  question,
  help,
  value,
  onChange,
}: {
  question: string
  help?: string | null
  value: AnswerValue | undefined
  onChange: (v: AnswerValue | undefined) => void
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={question}>
      <AppText variant="label">{question}</AppText>
      {help ? (
        <AppText variant="caption" muted>
          {help}
        </AppText>
      ) : null}
      <View style={styles.row}>
        {ANSWER_VALUES.map((v, i) => {
          const selected = value === v
          const tone = v === 'sim' ? colors.success : v === 'nao' ? colors.danger : colors.textMuted
          return (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${ANSWER_LABELS[v]}, opção ${i + 1} de 3`}
              accessibilityHint={selected ? 'Toque de novo para desmarcar' : undefined}
              onPress={() => onChange(selected ? undefined : v)}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: selected ? tone : colors.border,
                  backgroundColor: selected ? tone : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <AppText variant="label" color={selected ? colors.onSeal : colors.text}>
                {selected ? '● ' : '○ '}
                {ANSWER_LABELS[v]}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: TOUCH_MIN,
    minWidth: 88,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
})
