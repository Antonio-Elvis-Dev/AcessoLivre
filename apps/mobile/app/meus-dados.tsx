import { Share } from 'react-native'
import { ANSWER_LABELS, type AnswerValue } from '@acessolivre/shared'
import { AppText } from '../src/components/AppText'
import { Button } from '../src/components/Button'
import { Card, Screen } from '../src/components/Screen'
import { ErrorState, Loading } from '../src/components/States'
import { useMe } from '../src/hooks/queries'

/** Acesso e portabilidade dos dados (LGPD). */
export default function MyDataScreen() {
  const { data, isLoading, isError, error, refetch } = useMe()
  if (isLoading) return <Loading />
  if (isError || !data)
    return <ErrorState message={(error as Error)?.message ?? 'Erro'} onRetry={refetch} />

  const date = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')
  return (
    <Screen>
      <AppText>Estes são todos os dados que o AcessoLivre guarda sobre você.</AppText>
      <Card>
        <AppText variant="subtitle" accessibilityRole="header">
          Conta
        </AppText>
        <AppText>Nome: {data.user.name}</AppText>
        <AppText>E-mail: {data.user.email}</AppText>
        <AppText>Conta criada em {date(data.user.createdAt)}</AppText>
        <AppText>
          Termo aceito em {date(data.user.termsAcceptedAt)} (versão {data.user.termsVersion})
        </AppText>
        <AppText>Localização: não guardamos.</AppText>
      </Card>
      <Card>
        <AppText variant="subtitle" accessibilityRole="header">
          Avaliações ({data.evaluations.length})
        </AppText>
        {data.evaluations.length === 0 ? <AppText muted>Nenhuma avaliação.</AppText> : null}
        {data.evaluations.map((e) => (
          <AppText key={e.id}>
            • {e.place.name} em {date(e.createdAt)}
            {e.isCurrent ? '' : ' (substituída)'}: {e.answers.length} respostas
            {e.photos.length ? `, ${e.photos.length} foto(s)` : ''}
            {e.comment ? `, comentário: “${e.comment}”` : ''}
          </AppText>
        ))}
      </Card>
      <Card>
        <AppText variant="subtitle" accessibilityRole="header">
          Outras contribuições
        </AppText>
        <AppText>Votos em avaliações: {data.votes.length}</AppText>
        <AppText>
          Locais cadastrados: {data.places.map((p) => p.name).join(', ') || 'nenhum'}
        </AppText>
      </Card>
      <Button
        label="Exportar meus dados"
        variant="secondary"
        icon="share"
        accessibilityLabel="Exportar meus dados em texto para salvar ou enviar"
        onPress={() => {
          const readable = {
            ...data,
            evaluations: data.evaluations.map((e) => ({
              ...e,
              answers: e.answers.map((a) => ({
                ...a,
                value: ANSWER_LABELS[a.value as AnswerValue] ?? a.value,
              })),
            })),
          }
          void Share.share({
            title: 'Meus dados no AcessoLivre',
            message: JSON.stringify(readable, null, 2),
          })
        }}
      />
    </Screen>
  )
}
