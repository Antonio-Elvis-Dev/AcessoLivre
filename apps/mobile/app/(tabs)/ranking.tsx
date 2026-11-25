import { useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { AppText } from '../../src/components/AppText'
import { Card } from '../../src/components/Screen'
import { EmptyState, ErrorState, Loading } from '../../src/components/States'
import { useRanking } from '../../src/hooks/queries'
import { useText } from '../../src/i18n/texts'
import { useAuth } from '../../src/store/auth'
import { spacing, useTheme } from '../../src/theme'

const MEDALS = ['🥇', '🥈', '🥉']

/** Ranking da comunidade (RF05). */
export default function RankingScreen() {
  const { colors } = useTheme()
  const t = useText()
  const navigation = useNavigation()
  const userId = useAuth((s) => s.user?.id)
  const { data, isLoading, isError, error, refetch, isRefetching } = useRanking()

  useEffect(() => {
    navigation.setOptions({
      title: t('rankingTitle').text,
      headerTitleAccessibilityLabel: t('rankingTitle').label,
    })
  }, [navigation, t])

  if (isLoading) return <Loading />
  if (isError) return <ErrorState message={(error as Error).message} onRetry={refetch} />

  const p = data?.points ?? {}
  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      data={data?.ranking ?? []}
      keyExtractor={(r) => r.userId}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText>
            Cada contribuição vale ponto: {p.evaluation ?? 10} por local avaliado, {p.photo ?? 3}{' '}
            por foto, {p.place ?? 5} por local cadastrado, {p.vote ?? 1} por voto e{' '}
            {p.confirmationReceived ?? 2} quando alguém confirma sua avaliação.
          </AppText>
          {data?.me ? (
            <Card>
              <AppText variant="label">
                Você está em {data.me.position}º lugar, com {data.me.points} pontos.
              </AppText>
            </Card>
          ) : null}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => {
        const mine = item.userId === userId
        return (
          <View
            accessible
            accessibilityLabel={`${item.position}º lugar: ${mine ? 'você' : item.name}, ${item.points} pontos, ${item.evaluations} locais avaliados`}
            style={[
              styles.row,
              {
                backgroundColor: mine ? colors.surfaceAlt : colors.surface,
                borderColor: mine ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText variant="subtitle" style={styles.position}>
              {MEDALS[item.position - 1] ?? `${item.position}º`}
            </AppText>
            <View style={styles.flex}>
              <AppText variant="label">
                {item.name}
                {mine ? ' (você)' : ''}
              </AppText>
              <AppText variant="caption" muted>
                {item.evaluations} {item.evaluations === 1 ? 'local avaliado' : 'locais avaliados'}
              </AppText>
            </View>
            <AppText variant="subtitle">{item.points} pts</AppText>
          </View>
        )
      }}
      ListEmptyComponent={
        <EmptyState message="Ninguém pontuou ainda. Avalie um local e seja o primeiro!" />
      }
    />
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  header: { gap: spacing.md, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 48,
  },
  position: { minWidth: 40, textAlign: 'center' },
  flex: { flex: 1 },
})
