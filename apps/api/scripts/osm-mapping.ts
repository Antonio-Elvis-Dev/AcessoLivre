import type { PlaceType } from '@acessolivre/shared'

export interface OsmElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

const AMENITY: Record<string, PlaceType> = {
  hospital: 'saude',
  clinic: 'saude',
  doctors: 'saude',
  dentist: 'saude',
  pharmacy: 'saude',
  school: 'educacao',
  university: 'educacao',
  college: 'educacao',
  kindergarten: 'educacao',
  library: 'educacao',
  townhall: 'servico_publico',
  courthouse: 'servico_publico',
  police: 'servico_publico',
  post_office: 'servico_publico',
  public_building: 'servico_publico',
  social_facility: 'servico_publico',
  bank: 'banco',
  atm: 'banco',
  restaurant: 'alimentacao',
  fast_food: 'alimentacao',
  cafe: 'alimentacao',
  ice_cream: 'alimentacao',
  marketplace: 'comercio',
  bus_station: 'transporte',
  taxi: 'transporte',
  place_of_worship: 'religioso',
  theatre: 'lazer',
  cinema: 'lazer',
  community_centre: 'lazer',
  arts_centre: 'lazer',
}

/** Converte a categoria do OSM para um tipo de local do AcessoLivre. */
export function osmPlaceType(tags: Record<string, string>): PlaceType | null {
  if (tags.amenity && AMENITY[tags.amenity]) return AMENITY[tags.amenity] as PlaceType
  if (tags.healthcare) return 'saude'
  if (tags.office === 'government') return 'servico_publico'
  if (tags.shop) return 'comercio'
  if (tags.leisure === 'park' || tags.leisure === 'sports_centre' || tags.leisure === 'stadium')
    return 'lazer'
  if (tags.tourism === 'hotel' || tags.tourism === 'guest_house') return 'hospedagem'
  if (tags.tourism === 'museum') return 'lazer'
  return null
}

export function osmAddress(tags: Record<string, string>): string | null {
  const street = tags['addr:street']
  if (!street) return null
  const parts = [street + (tags['addr:housenumber'] ? `, ${tags['addr:housenumber']}` : '')]
  if (tags['addr:suburb']) parts.push(tags['addr:suburb'])
  parts.push(`${tags['addr:city'] ?? 'Arapiraca'} - AL`)
  return parts.join(', ')
}

export function osmToPlace(el: OsmElement) {
  const tags = el.tags ?? {}
  const name = tags.name?.trim()
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  const type = osmPlaceType(tags)
  if (!name || lat === undefined || lng === undefined || !type) return null
  return { osmId: `${el.type}/${el.id}`, name, type, lat, lng, address: osmAddress(tags) }
}
