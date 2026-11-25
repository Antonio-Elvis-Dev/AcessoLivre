import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { AccessibilityInfo, Linking, StyleSheet, View } from 'react-native'
import { PLACE_TYPE_LABELS, type PlaceDetail, type VoteType } from '@acessolivre/shared'
import { AppText } from '../../src/components/AppText'
import { Button } from '../../src/components/Button'
import { CategoryBar } from '../../src/components/CategoryBar'
import { EvaluationCard } from '../../src/components/EvaluationCard'
import { Card, Screen } from '../../src/components/Screen'
import { SealBadge } from '../../src/components/SealBadge'
import { ErrorState, Loading } from '../../src/components/States'
import { queryKeys, usePlace } from '../../src/hooks/queries'
import { useText } from '../../src/i18n/texts'
import { api } from '../../src/services/api'
import { useAuth } from '../../src/store/auth'
import { spacing, useTheme } from '../../src/theme'

/** Detalhe do local com selo (RF03) e confirmar/contestar avaliações (RF04). */
export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const t = useText()
  const user = useAuth((s) => s.user)
  const queryClient = useQueryClient()
  const { data: place, isLoading, isError, error, refetch } = usePlace(id)

  const vote = useMutation({
    mutationFn: ({ evaluationId, type }: { evaluationId: string; type: VoteType | null }) =>
      type ? api.vote(evaluationId, type) : api.unvote(evaluationId),
    onSuccess: (res, { evaluationId, type }) => {
      queryClient.setQueryData<PlaceDetail>(queryKeys.place(id, user?.id), (old) =>
        old
          ? {
              ...old,
              approval: res.place.approval,
              seal: res.place.seal,
              evaluations: old.evaluations.map((e) =>
                e.id === evaluationId
                  ? {
                      ...e,
                      confirmations: res.confirmations,
                      contestations: res.contestations,
                      myVote: res.myVote,
                    }
                  : e,
              ),
            }
          : old,
      )
      void queryClient.invalidateQueries({ queryKey: ['places'] })
      AccessibilityInfo.announceForAccessibility(
        type === 'confirma'
          ? 'Avaliação confirmada'
          : type === 'contesta'
            ? 'Avaliação contestada'
            : 'Voto retirado',
      )
    },
  })

  if (isLoading) return <Loading label="Carregando local..." />
  if (isError || !place)
    return (
      <ErrorState
        message={(error as Error)?.message ?? 'Local não encontrado.'}
        onRetry={refetch}
      />
    )

  const goEvaluate = () => (user ? router.push(`/avaliar/${place.id}`) : router.push('/login'))
  const openInMaps = () =>
    Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=19/${place.lat}/${place.lng}`,
    )

  return (
    <Screen>
      <Stack.Screen options={{ title: place.name }} />
      <View style={styles.gap}>
        <AppText variant="title">{place.name}</AppText>
        <AppText muted>
          {PLACE_TYPE_LABELS[place.type]}
          {place.address ? ` · ${place.address}` : ''}
        </AppText>
        {place.description ? <AppText>{place.description}</AppText> : null}
      </View>

      <SealBadge
        seal={place.seal}
        approval={place.approval}
        evaluationCount={place.evaluationCount}
        size="lg"
      />

      <Button
        label={place.myEvaluationId ? 'Atualizar minha avaliação' : t('evaluateCta').text}
        accessibilityLabel={
          place.myEvaluationId ? 'Atualizar minha avaliação' : t('evaluateCta').label
        }
        icon="create"
        onPress={goEvaluate}
      />
      <Button
        label="Abrir no mapa (OpenStreetMap)"
        variant="secondary"
        icon="navigate"
        onPress={openInMaps}
      />

      {place.highlights.length ? (
        <Card>
          <AppText variant="subtitle" accessibilityRole="header">
            O que tem aqui
          </AppText>
          {place.highlights.map((h) => (
            <AppText key={h.questionKey} color={colors.success}>
              ✓ {h.text} ({h.yes} {h.yes === 1 ? 'pessoa confirmou' : 'pessoas confirmaram'})
            </AppText>
          ))}
        </Card>
      ) : null}

      {place.barriers.length ? (
        <Card>
          <AppText variant="subtitle" accessibilityRole="header">
            Barreiras apontadas
          </AppText>
          {place.barriers.map((h) => (
            <AppText key={h.questionKey} color={colors.danger}>
              ✗ {h.text} ({h.no} {h.no === 1 ? 'pessoa disse que não' : 'pessoas disseram que não'})
            </AppText>
          ))}
        </Card>
      ) : null}

      <Card>
        <AppText variant="subtitle" accessibilityRole="header">
          Aprovação por categoria
        </AppText>
        {place.categories.map((c) => (
          <CategoryBar key={c.slug} name={c.name} approval={c.approval} answers={c.answers} />
        ))}
      </Card>

      <AppText variant="subtitle" accessibilityRole="header">
        Avaliações da comunidade ({place.evaluations.length})
      </AppText>
      {place.evaluations.length === 0 ? (
        <AppText muted>Ninguém avaliou ainda. Seja a primeira pessoa!</AppText>
      ) : (
        <>
          {user ? (
            <AppText variant="caption" muted>
              Esteve no local? Confirme as avaliações que estão certas e conteste as que não estão.
              As mais recentes aparecem primeiro e pesam mais no selo.
            </AppText>
          ) : (
            <AppText variant="caption" muted>
              Entre na sua conta para confirmar ou contestar avaliações.
            </AppText>
          )}
          {place.evaluations.map((e) => (
            <EvaluationCard
              key={e.id}
              evaluation={e}
              canVote={!!user}
              voting={vote.isPending}
              onVote={(type) => vote.mutate({ evaluationId: e.id, type })}
            />
          ))}
        </>
      )}
      {vote.isError ? (
        <AppText color={colors.danger} accessibilityLiveRegion="assertive">
          {(vote.error as Error).message}
        </AppText>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({ gap: { gap: spacing.xs } })
