import { router, useNavigation } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { FlatList, ScrollView, StyleSheet, View } from 'react-native'
import {
  CATEGORIES,
  PLACE_TYPE_LABELS,
  PLACE_TYPES,
  type CategorySlug,
  type PlaceType,
} from '@acessolivre/shared'
import { AppText } from '../../src/components/AppText'
import { Button } from '../../src/components/Button'
import { Chip } from '../../src/components/Chip'
import { PlaceCard } from '../../src/components/PlaceCard'
import { EmptyState, ErrorState, Loading } from '../../src/components/States'
import { TextField } from '../../src/components/TextField'
import { usePlaces } from '../../src/hooks/queries'
import { useUserLocation } from '../../src/hooks/useUserLocation'
import { useText } from '../../src/i18n/texts'
import { spacing, useTheme } from '../../src/theme'
import { bboxAround, distanceMeters } from '../../src/utils/geo'

/**
 * Lista de locais: alternativa acessível ao mapa (leitor de tela). Com a
 * localização, ordena pela distância calculada no próprio aparelho.
 */
export default function ListScreen() {
  const { colors } = useTheme()
  const t = useText()
  const navigation = useNavigation()
  const location = useUserLocation()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [type, setType] = useState<PlaceType | undefined>()
  const [category, setCategory] = useState<CategorySlug | undefined>()

  useEffect(() => {
    navigation.setOptions({
      title: t('listTitle').text,
      headerTitleAccessibilityLabel: t('listTitle').label,
    })
  }, [navigation, t])

  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 400)
    return () => clearTimeout(id)
  }, [search])

  const bbox = location.coords ? bboxAround(location.coords, 10) : undefined
  const { data, isLoading, isError, error, refetch, isRefetching } = usePlaces({
    bbox,
    q: q || undefined,
    type,
    acessivelPara: category,
    limit: 200,
  })

  const items = useMemo(() => {
    const list = (data ?? []).map((p) => ({
      place: p,
      distance: location.coords
        ? distanceMeters(location.coords, { latitude: p.lat, longitude: p.lng })
        : undefined,
    }))
    if (location.coords) list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    return list
  }, [data, location.coords])

  const header = (
    <View style={styles.header}>
      <TextField
        label="Buscar pelo nome"
        placeholder="Ex.: farmácia, escola, praça"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        autoCorrect={false}
      />
      <Button
        variant="secondary"
        icon="locate"
        label={location.coords ? 'Ordenado pela distância' : 'Ordenar pela distância'}
        accessibilityLabel={
          location.coords
            ? 'Lista ordenada pela distância até você. Toque para atualizar a localização'
            : 'Usar minha localização para ordenar a lista pela distância'
        }
        loading={location.loading}
        onPress={() => void location.locate()}
      />
      {location.denied ? (
        <AppText variant="caption" muted>
          Sem permissão de localização. Mostrando os locais mais avaliados.
        </AppText>
      ) : null}
      <AppText variant="label" accessibilityRole="header">
        Acessível para
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORIES.map((c) => (
          <Chip
            key={c.slug}
            label={c.shortName}
            selected={category === c.slug}
            accessibilityHint={`Mostra só locais aprovados em ${c.name}`}
            onPress={() => setCategory(category === c.slug ? undefined : c.slug)}
          />
        ))}
      </ScrollView>
      <AppText variant="label" accessibilityRole="header">
        Tipo de local
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {PLACE_TYPES.map((tp) => (
          <Chip
            key={tp}
            label={PLACE_TYPE_LABELS[tp]}
            selected={type === tp}
            onPress={() => setType(type === tp ? undefined : tp)}
          />
        ))}
      </ScrollView>
      {data ? (
        <AppText variant="caption" muted accessibilityLiveRegion="polite">
          {items.length} {items.length === 1 ? 'local encontrado' : 'locais encontrados'}
        </AppText>
      ) : null}
    </View>
  )

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.place.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <PlaceCard
            place={item.place}
            distance={item.distance}
            onPress={() => router.push(`/local/${item.place.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <Loading label="Carregando locais..." />
          ) : isError ? (
            <ErrorState message={(error as Error).message} onRetry={refetch} />
          ) : (
            <EmptyState message={t('emptyList').text}>
              <Button
                label="Cadastrar um local"
                icon="add-circle"
                onPress={() => router.push('/local/novo')}
              />
            </EmptyState>
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
})
