import { describe, expect, it } from 'vitest'
import { osmToPlace } from '../scripts/osm-mapping'

describe('importação do OpenStreetMap', () => {
  it('converte um nó com nome e endereço', () => {
    expect(
      osmToPlace({
        type: 'node',
        id: 42,
        lat: -9.75,
        lon: -36.66,
        tags: {
          amenity: 'pharmacy',
          name: 'Farmácia Popular',
          'addr:street': 'Rua Expedicionários',
          'addr:housenumber': '10',
        },
      }),
    ).toEqual({
      osmId: 'node/42',
      name: 'Farmácia Popular',
      type: 'saude',
      lat: -9.75,
      lng: -36.66,
      address: 'Rua Expedicionários, 10, Arapiraca - AL',
    })
  })

  it('usa o centro de áreas e ignora elementos sem nome ou tipo conhecido', () => {
    expect(
      osmToPlace({
        type: 'way',
        id: 1,
        center: { lat: 1, lon: 2 },
        tags: { name: 'Escola', amenity: 'school' },
      }),
    ).toMatchObject({ osmId: 'way/1', type: 'educacao', lat: 1, lng: 2 })
    expect(
      osmToPlace({ type: 'node', id: 2, lat: 1, lon: 2, tags: { amenity: 'bench' } }),
    ).toBeNull()
    expect(
      osmToPlace({ type: 'node', id: 3, lat: 1, lon: 2, tags: { name: 'X', amenity: 'bench' } }),
    ).toBeNull()
  })
})
