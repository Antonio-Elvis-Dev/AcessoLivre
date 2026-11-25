import { Image, StyleSheet, View } from 'react-native'
import { CATEGORIES, type EvaluationView, type VoteType } from '@acessolivre/shared'
import { spacing, useTheme } from '../theme'
import { timeAgo } from '../utils/geo'
import { AppText } from './AppText'
import { Button } from './Button'
import { Card } from './Screen'

const QUESTION_TEXT = new Map(CATEGORIES.flatMap((c) => c.questions.map((q) => [q.key, q.text])))

/** Avaliação de um usuário, com botões de confirmar/contestar (RF04). */
export function EvaluationCard({
  evaluation,
  canVote,
  voting,
  onVote,
}: {
  evaluation: EvaluationView
  canVote: boolean
  voting?: boolean
  onVote: (type: VoteType | null) => void
}) {
  const { colors } = useTheme()
  const e = evaluation
  const yes = e.answers.filter((a) => a.value === 'sim')
  const no = e.answers.filter((a) => a.value === 'nao')

  return (
    <Card>
      <AppText variant="label">
        {e.isMine ? 'Sua avaliação' : e.author.name} · {timeAgo(e.createdAt)}
      </AppText>
      {e.comment ? <AppText>“{e.comment}”</AppText> : null}
      {yes.length ? (
        <AppText variant="caption" color={colors.success}>
          ✓ Tem: {yes.map((a) => QUESTION_TEXT.get(a.questionKey) ?? a.questionKey).join(' · ')}
        </AppText>
      ) : null}
      {no.length ? (
        <AppText variant="caption" color={colors.danger}>
          ✗ Não tem: {no.map((a) => QUESTION_TEXT.get(a.questionKey) ?? a.questionKey).join(' · ')}
        </AppText>
      ) : null}
      {e.photos.length ? (
        <View style={styles.photos}>
          {e.photos.map((p, i) => (
            <Image
              key={p.id}
              source={{ uri: p.url }}
              style={styles.photo}
              accessible
              accessibilityLabel={`Foto ${i + 1} enviada por ${e.isMine ? 'você' : e.author.name}`}
            />
          ))}
        </View>
      ) : null}
      <AppText variant="caption" muted>
        {e.confirmations} {e.confirmations === 1 ? 'confirmação' : 'confirmações'} ·{' '}
        {e.contestations} {e.contestations === 1 ? 'contestação' : 'contestações'}
      </AppText>
      {canVote && !e.isMine ? (
        <View style={styles.actions}>
          <Button
            compact
            label={e.myVote === 'confirma' ? 'Confirmado' : 'Confirmar'}
            accessibilityLabel={
              e.myVote === 'confirma'
                ? 'Você confirmou esta avaliação. Toque para retirar o voto'
                : 'Confirmar esta avaliação: eu também vi isso no local'
            }
            icon="thumbs-up"
            variant={e.myVote === 'confirma' ? 'primary' : 'secondary'}
            disabled={voting}
            onPress={() => onVote(e.myVote === 'confirma' ? null : 'confirma')}
            style={styles.flex}
          />
          <Button
            compact
            label={e.myVote === 'contesta' ? 'Contestado' : 'Contestar'}
            accessibilityLabel={
              e.myVote === 'contesta'
                ? 'Você contestou esta avaliação. Toque para retirar o voto'
                : 'Contestar esta avaliação: o local não está assim'
            }
            icon="thumbs-down"
            variant={e.myVote === 'contesta' ? 'primary' : 'secondary'}
            disabled={voting}
            onPress={() => onVote(e.myVote === 'contesta' ? null : 'contesta')}
            style={styles.flex}
          />
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  photo: { width: 96, height: 96, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flexGrow: 1 },
})
