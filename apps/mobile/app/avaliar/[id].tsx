import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { AccessibilityInfo, Image, Pressable, StyleSheet, View } from 'react-native'
import type { AnswerValue } from '@acessolivre/shared'
import { AnswerSelector } from '../../src/components/AnswerSelector'
import { AppText } from '../../src/components/AppText'
import { Button } from '../../src/components/Button'
import { Card, Screen } from '../../src/components/Screen'
import { ErrorState, Loading } from '../../src/components/States'
import { TextField } from '../../src/components/TextField'
import { useCategories, usePlace } from '../../src/hooks/queries'
import { useText } from '../../src/i18n/texts'
import { api } from '../../src/services/api'
import { useAuth } from '../../src/store/auth'
import { radius, spacing, TOUCH_MIN, useTheme } from '../../src/theme'

const MAX_PHOTOS = 3

/** Reduz a foto para no máximo 1600 px e JPEG, para enviar rápido mesmo no 3G. */
async function preparePhoto(uri: string): Promise<string> {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: 1600 }).renderAsync()
  const result = await ref.saveAsync({ compress: 0.7, format: SaveFormat.JPEG })
  return result.uri
}

/** Formulário de avaliação por categorias (RF02). */
export default function EvaluateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const t = useText()
  const token = useAuth((s) => s.token)
  const queryClient = useQueryClient()
  const categories = useCategories()
  const place = usePlace(id)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>('mobilidade')
  const [photoError, setPhotoError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) router.replace('/login')
  }, [token])

  // Preenche com a avaliação anterior, se houver.
  useEffect(() => {
    const mine = place.data?.evaluations.find((e) => e.isMine)
    if (mine && Object.keys(answers).length === 0) {
      setAnswers(Object.fromEntries(mine.answers.map((a) => [a.questionKey, a.value])))
      setComment(mine.comment ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.data])

  const answeredCount = Object.keys(answers).length
  const counts = useMemo(
    () =>
      Object.fromEntries(
        (categories.data ?? []).map((c) => [
          c.slug,
          c.questions.filter((q) => answers[q.key]).length,
        ]),
      ),
    [categories.data, answers],
  )

  const submit = useMutation({
    mutationFn: async () => {
      const res = await api.evaluate(id, {
        answers: Object.entries(answers).map(([questionKey, value]) => ({ questionKey, value })),
        comment: comment.trim() || undefined,
      })
      const failed: number[] = []
      for (const [i, uri] of photos.entries()) {
        try {
          await api.uploadPhoto(res.evaluation.id, await preparePhoto(uri))
        } catch {
          failed.push(i + 1)
        }
      }
      return { res, failed }
    },
    onSuccess: ({ failed }) => {
      void queryClient.invalidateQueries({ queryKey: ['place', id] })
      void queryClient.invalidateQueries({ queryKey: ['places'] })
      void queryClient.invalidateQueries({ queryKey: ['ranking'] })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      const msg = t('thanks')
      AccessibilityInfo.announceForAccessibility(
        failed.length
          ? `${msg.label} Mas não deu para enviar ${failed.length} foto(s).`
          : msg.label,
      )
      router.back()
    },
  })

  async function addPhoto(source: 'camera' | 'library') {
    setPhotoError(null)
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setPhotoError(
        'Sem permissão para acessar a câmera ou as fotos. Você pode liberar nas configurações do celular.',
      )
      return
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options)
    const uri = result.canceled ? undefined : result.assets[0]?.uri
    if (uri) setPhotos((p) => [...p, uri].slice(0, MAX_PHOTOS))
  }

  if (categories.isLoading || place.isLoading) return <Loading />
  if (categories.isError)
    return <ErrorState message={(categories.error as Error).message} onRetry={categories.refetch} />

  return (
    <Screen>
      <AppText variant="title">{place.data?.name ?? 'Avaliar local'}</AppText>
      <AppText>
        Responda só o que você viu. Se não souber, marque “Não sei” ou deixe em branco. Toque numa
        categoria para abrir as perguntas.
      </AppText>

      {(categories.data ?? []).map((c) => {
        const expanded = open === c.slug
        return (
          <Card key={c.slug}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${c.name}. ${counts[c.slug] ?? 0} de ${c.questions.length} respondidas`}
              accessibilityHint={expanded ? 'Fecha as perguntas' : 'Abre as perguntas'}
              onPress={() => setOpen(expanded ? null : c.slug)}
              style={styles.catHeader}
            >
              <View style={styles.flex}>
                <AppText variant="subtitle">{c.name}</AppText>
                <AppText variant="caption" muted>
                  {c.description} · {counts[c.slug] ?? 0}/{c.questions.length} respondidas
                </AppText>
              </View>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={28}
                color={colors.text}
              />
            </Pressable>
            {expanded
              ? c.questions.map((q) => (
                  <AnswerSelector
                    key={q.key}
                    question={q.text}
                    help={q.help}
                    value={answers[q.key]}
                    onChange={(v) =>
                      setAnswers((prev) => {
                        const next = { ...prev }
                        if (v) next[q.key] = v
                        else delete next[q.key]
                        return next
                      })
                    }
                  />
                ))
              : null}
          </Card>
        )
      })}

      <TextField
        label="Comentário (opcional)"
        help="Conte algo que ajude outras pessoas. Ex.: a rampa fica na entrada lateral."
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={1000}
      />

      <Card>
        <AppText variant="subtitle" accessibilityRole="header">
          Fotos (opcional, até {MAX_PHOTOS})
        </AppText>
        <AppText variant="caption" muted>
          Fotografe rampas, portas, banheiros e placas. Evite mostrar o rosto de pessoas e placas de
          carros.
        </AppText>
        <View style={styles.photos}>
          {photos.map((uri, i) => (
            <View key={uri} style={styles.photoWrap}>
              <Image
                source={{ uri }}
                style={styles.photo}
                accessible
                accessibilityLabel={`Foto ${i + 1}`}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover foto ${i + 1}`}
                onPress={() => setPhotos((p) => p.filter((x) => x !== uri))}
                hitSlop={8}
                style={[styles.removePhoto, { backgroundColor: colors.danger }]}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
        {photos.length < MAX_PHOTOS ? (
          <View style={styles.row}>
            <Button
              compact
              variant="secondary"
              icon="camera"
              label="Tirar foto"
              onPress={() => addPhoto('camera')}
              style={styles.grow}
            />
            <Button
              compact
              variant="secondary"
              icon="images"
              label="Da galeria"
              onPress={() => addPhoto('library')}
              style={styles.grow}
            />
          </View>
        ) : null}
        {photoError ? (
          <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
            {photoError}
          </AppText>
        ) : null}
      </Card>

      {submit.isError ? (
        <AppText color={colors.danger} accessibilityLiveRegion="assertive">
          {(submit.error as Error).message}
        </AppText>
      ) : null}
      <Button
        label={
          answeredCount
            ? `Enviar avaliação (${answeredCount} respostas)`
            : 'Responda pelo menos uma pergunta'
        }
        icon="send"
        disabled={answeredCount === 0}
        loading={submit.isPending}
        onPress={() => submit.mutate()}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: TOUCH_MIN },
  photos: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  photoWrap: { position: 'relative' },
  photo: { width: 100, height: 100, borderRadius: radius.md },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: TOUCH_MIN - 8,
    height: TOUCH_MIN - 8,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  grow: { flexGrow: 1 },
})
