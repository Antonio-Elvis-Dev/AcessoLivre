import { Ionicons } from '@expo/vector-icons'
import { router, useNavigation } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, View } from 'react-native'
import MapView, { Marker, UrlTile, type Region } from 'react-native-maps'
import {
  CATEGORIES,
  PLACE_TYPE_LABELS,
  type CategorySlug,
  type PlaceSummary,
} from '@acessolivre/shared'
import { AppText } from '../../src/components/AppText'
import { Button } from '../../src/components/Button'
import { Chip } from '../../src/components/Chip'
import { SEAL_ICONS, SealBadge, sealAccessibilityLabel } from '../../src/components/SealBadge'
import { usePlaces } from '../../src/hooks/queries'
import { useUserLocation } from '../../src/hooks/useUserLocation'
import { useText } from '../../src/i18n/texts'
import { radius, spacing, useTheme } from '../../src/theme'
import { ARAPIRACA, bboxFromRegion } from '../../src/utils/geo'

const INITIAL_REGION: Region = { ...ARAPIRACA, latitudeDelta: 0.03, longitudeDelta: 0.03 }

/**
 * Mapa base. Por padrão usamos o mapa nativo do aparelho (Google Maps no Android,
 * Apple Maps no iOS), que já vem com licença para apps.
 *
 * Não use os tiles públicos de tile.openstreetmap.org: a política de uso do OSM
 * bloqueia apps (o mapa aparece como "403 Access blocked"). Para um visual OSM,
 * use um provedor que permite apps (MapTiler, Stadia Maps, Carto...) definindo
 * EXPO_PUBLIC_MAP_TILES_URL e EXPO_PUBLIC_MAP_TILES_ATTRIBUTION no .env.
 */
const CUSTOM_TILES_URL = process.env.EXPO_PUBLIC_MAP_TILES_URL?.trim() || undefined
const CUSTOM_TILES_ATTRIBUTION = process.env.EXPO_PUBLIC_MAP_TILES_ATTRIBUTION?.trim()
/** Os locais podem vir do OpenStreetMap (pnpm api osm:import), cujos dados exigem atribuição (ODbL). */
const ATTRIBUTION = CUSTOM_TILES_ATTRIBUTION || 'Locais: © colaboradores do OpenStreetMap'

export default function MapScreen() {
  const { colors } = useTheme()
  const t = useText()
  const navigation = useNavigation()
  const mapRef = useRef<MapView>(null)
  const [region, setRegion] = useState<Region>(INITIAL_REGION)
  const [selected, setSelected] = useState<PlaceSummary | null>(null)
  const [category, setCategory] = useState<CategorySlug | undefined>()
  const [screenReader, setScreenReader] = useState(false)
  const location = useUserLocation()

  useEffect(() => {
    navigation.setOptions({
      title: t('mapTitle').text,
      headerTitleAccessibilityLabel: t('mapTitle').label,
    })
  }, [navigation, t])

  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader)
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader)
    return () => sub.remove()
  }, [])

  const bbox = useMemo(() => bboxFromRegion(region), [region])
  const {
    data: places = [],
    isFetching,
    isError,
    refetch,
  } = usePlaces({
    bbox,
    acessivelPara: category,
    limit: 300,
  })

  async function goToMyLocation() {
    const c = await location.locate()
    if (c)
      mapRef.current?.animateToRegion({ ...c, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 600)
  }

  return (
    <View style={styles.flex}>
      {screenReader ? (
        <View
          style={[
            styles.banner,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <AppText>Com leitor de tela, a lista de locais é mais fácil de usar que o mapa.</AppText>
          <Button
            label="Abrir a lista de locais"
            icon="list"
            onPress={() => router.navigate('/lista')}
          />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filters, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.filtersContent}
        accessibilityLabel="Filtrar locais acessíveis para"
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

      <View style={styles.flex}>
        <MapView
          ref={mapRef}
          style={styles.flex}
          initialRegion={INITIAL_REGION}
          onRegionChangeComplete={setRegion}
          mapType={CUSTOM_TILES_URL && Platform.OS === 'android' ? 'none' : 'standard'}
          showsUserLocation={!!location.coords}
          showsPointsOfInterests={false}
          toolbarEnabled={false}
          onPress={() => setSelected(null)}
          accessibilityLabel={`Mapa com ${places.length} locais na área visível`}
        >
          {CUSTOM_TILES_URL ? (
            <UrlTile
              urlTemplate={CUSTOM_TILES_URL}
              maximumZ={19}
              shouldReplaceMapContent
              tileSize={256}
            />
          ) : null}
          {places.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              onPress={(e) => {
                e.stopPropagation()
                setSelected(p)
              }}
              tracksViewChanges={false}
              accessibilityLabel={`${p.name}. ${sealAccessibilityLabel(p.seal, p.approval, p.evaluationCount)}`}
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: colors.seal[p.seal],
                    borderColor: selected?.id === p.id ? colors.focus : '#FFFFFF',
                  },
                ]}
              >
                <Ionicons name={SEAL_ICONS[p.seal]} size={22} color={colors.onSeal} />
              </View>
            </Marker>
          ))}
        </MapView>

        <View style={[styles.attribution, { backgroundColor: colors.surface }]} accessible={false}>
          <AppText variant="caption">{ATTRIBUTION}</AppText>
        </View>

        {isFetching ? (
          <View
            style={[styles.status, { backgroundColor: colors.surface }]}
            accessibilityLiveRegion="polite"
          >
            <AppText variant="caption">Carregando locais...</AppText>
          </View>
        ) : isError ? (
          <View
            style={[styles.status, { backgroundColor: colors.surface }]}
            accessibilityLiveRegion="polite"
          >
            <AppText variant="caption" color={colors.danger} onPress={() => refetch()}>
              Não deu para carregar os locais. Toque para tentar de novo.
            </AppText>
          </View>
        ) : null}

        <View style={styles.fabs}>
          <Button
            compact
            icon="locate"
            label="Perto de mim"
            accessibilityLabel="Centralizar o mapa na minha localização"
            variant="primary"
            loading={location.loading}
            onPress={goToMyLocation}
          />
          <Button
            compact
            icon="add-circle"
            label="Novo local"
            accessibilityLabel="Cadastrar um local novo no centro do mapa"
            variant="primary"
            onPress={() =>
              router.push({
                pathname: '/local/novo',
                params: { lat: String(region.latitude), lng: String(region.longitude) },
              })
            }
          />
        </View>
        {location.denied ? (
          <View style={[styles.status, { backgroundColor: colors.surface }]}>
            <AppText variant="caption">
              Sem permissão de localização. O mapa continua em Arapiraca.
            </AppText>
          </View>
        ) : null}

        {selected ? (
          <View
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityViewIsModal={false}
          >
            <AppText variant="subtitle">{selected.name}</AppText>
            <AppText variant="caption" muted>
              {PLACE_TYPE_LABELS[selected.type]}
              {selected.address ? ` · ${selected.address}` : ''}
            </AppText>
            <SealBadge
              seal={selected.seal}
              approval={selected.approval}
              evaluationCount={selected.evaluationCount}
            />
            <View style={styles.sheetActions}>
              <Button
                label="Ver detalhes"
                icon="information-circle"
                onPress={() => router.push(`/local/${selected.id}`)}
                style={styles.grow}
              />
              <Button
                label="Fechar"
                variant="secondary"
                accessibilityLabel="Fechar resumo do local"
                onPress={() => setSelected(null)}
              />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: { padding: spacing.md, gap: spacing.sm, borderBottomWidth: 1 },
  filters: { flexGrow: 0 },
  filtersContent: { gap: spacing.sm, padding: spacing.sm },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attribution: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
    opacity: 0.9,
  },
  status: {
    position: 'absolute',
    top: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  fabs: { position: 'absolute', right: spacing.md, top: spacing.xl + spacing.md, gap: spacing.sm },
  sheet: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sheetActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  grow: { flexGrow: 1 },
})
