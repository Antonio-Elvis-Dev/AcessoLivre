import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  createPlaceSchema,
  PLACE_TYPE_LABELS,
  PLACE_TYPES,
  type PlaceType,
} from '@acessolivre/shared'
import { AppText } from '../../src/components/AppText'
import { Button } from '../../src/components/Button'
import { Chip } from '../../src/components/Chip'
import { Card, Screen } from '../../src/components/Screen'
import { TextField } from '../../src/components/TextField'
import { useUserLocation } from '../../src/hooks/useUserLocation'
import { api, RequestError } from '../../src/services/api'
import { useAuth } from '../../src/store/auth'
import { spacing, useTheme } from '../../src/theme'
import { fieldErrors } from '../../src/utils/form'

export default function NewPlaceScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>()
  const { colors } = useTheme()
  const token = useAuth((s) => s.token)
  const queryClient = useQueryClient()
  const location = useUserLocation()
  const [name, setName] = useState('')
  const [type, setType] = useState<PlaceType | undefined>()
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    params.lat && params.lng ? { lat: Number(params.lat), lng: Number(params.lng) } : null,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) router.replace('/login')
  }, [token])

  const save = useMutation({
    mutationFn: api.createPlace,
    onSuccess: (place) => {
      void queryClient.invalidateQueries({ queryKey: ['places'] })
      router.replace(`/local/${place.id}`)
    },
  })

  async function useMyLocation() {
    const c = await location.locate()
    if (c) setCoords({ lat: c.latitude, lng: c.longitude })
  }

  function submit() {
    const parsed = createPlaceSchema.safeParse({
      name,
      type,
      address: address || undefined,
      description: description || undefined,
      lat: coords?.lat,
      lng: coords?.lng,
    })
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error)
      if (!coords) errs.lat = 'Escolha a posição do local: use sua localização ou o centro do mapa.'
      setErrors(errs)
      return
    }
    setErrors({})
    save.mutate(parsed.data)
  }

  const apiError = save.error instanceof RequestError ? save.error.message : null

  return (
    <Screen>
      <AppText>Cadastre um lugar que ainda não está no mapa. Depois você já pode avaliar.</AppText>
      <TextField
        label="Nome do local"
        value={name}
        onChangeText={setName}
        error={errors.name}
        maxLength={120}
      />

      <View style={styles.gap} accessibilityRole="radiogroup" accessibilityLabel="Tipo de local">
        <AppText variant="label">Tipo de local</AppText>
        <View style={styles.wrap}>
          {PLACE_TYPES.map((tp) => (
            <Chip
              key={tp}
              label={PLACE_TYPE_LABELS[tp]}
              selected={type === tp}
              onPress={() => setType(tp)}
            />
          ))}
        </View>
        {errors.type ? (
          <AppText variant="caption" color={colors.danger}>
            {errors.type}
          </AppText>
        ) : null}
      </View>

      <TextField
        label="Endereço (opcional)"
        value={address}
        onChangeText={setAddress}
        maxLength={200}
      />
      <TextField
        label="Descrição (opcional)"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={500}
      />

      <Card>
        <AppText variant="label">Posição no mapa</AppText>
        <AppText variant="caption" muted accessibilityLiveRegion="polite">
          {coords
            ? params.lat && coords.lat === Number(params.lat)
              ? 'Usando o centro do mapa. Se você está no local, use sua localização para mais precisão.'
              : 'Usando sua localização atual.'
            : 'Nenhuma posição escolhida ainda.'}
        </AppText>
        <Button
          variant="secondary"
          icon="locate"
          label="Usar minha localização"
          loading={location.loading}
          onPress={useMyLocation}
        />
        {errors.lat ? (
          <AppText variant="caption" color={colors.danger}>
            {errors.lat}
          </AppText>
        ) : null}
      </Card>

      {apiError ? (
        <AppText color={colors.danger} accessibilityLiveRegion="assertive">
          {apiError}
        </AppText>
      ) : null}
      <Button label="Cadastrar local" icon="checkmark" loading={save.isPending} onPress={submit} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  gap: { gap: spacing.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
})
