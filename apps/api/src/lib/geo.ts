import { Prisma } from '@prisma/client'
import type { ListPlacesQuery, PlaceSummary, PlaceType, SealLevel } from '@acessolivre/shared'

/** Linha crua de `places` com as coordenadas extraídas do ponto PostGIS. */
export interface PlaceRow {
  id: string
  name: string
  type: string
  address: string | null
  description: string | null
  osm_id: string | null
  lat: number
  lng: number
  approval: number | null
  seal: string
  evaluation_count: number
  created_at: Date
  distance?: number | null
}

export const PLACE_COLUMNS = Prisma.sql`
  p.id, p.name, p.type, p.address, p.description, p.osm_id,
  ST_Y(p.location::geometry) AS lat, ST_X(p.location::geometry) AS lng,
  p.approval, p.seal, p.evaluation_count, p.created_at`

export function toPlaceSummary(row: PlaceRow): PlaceSummary {
  const summary: PlaceSummary = {
    id: row.id,
    name: row.name,
    type: row.type as PlaceType,
    address: row.address,
    lat: Number(row.lat),
    lng: Number(row.lng),
    approval: row.approval,
    seal: row.seal as SealLevel,
    evaluationCount: row.evaluation_count,
  }
  if (row.distance !== undefined && row.distance !== null) {
    summary.distance = Math.round(Number(row.distance))
  }
  return summary
}

export function point(lat: number, lng: number) {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`
}

/** Monta a consulta de listagem: área visível (bbox), raio ou lista geral. */
export function buildListPlacesQuery(q: ListPlacesQuery) {
  const where: Prisma.Sql[] = []
  let distance = Prisma.sql`NULL::float8`
  let order = Prisma.sql`p.evaluation_count DESC, p.name ASC`

  if (q.bbox) {
    const [minLng, minLat, maxLng, maxLat] = q.bbox.split(',').map(Number) as [
      number,
      number,
      number,
      number,
    ]
    where.push(
      Prisma.sql`p.location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)::geography`,
    )
  }

  if (q.lat !== undefined && q.lng !== undefined) {
    const origin = point(q.lat, q.lng)
    distance = Prisma.sql`ST_Distance(p.location, ${origin})`
    if (!q.bbox) where.push(Prisma.sql`ST_DWithin(p.location, ${origin}, ${q.raio})`)
    order = Prisma.sql`distance ASC`
  }

  if (q.q) where.push(Prisma.sql`p.name ILIKE ${'%' + q.q.replace(/[%_\\]/g, '\\$&') + '%'}`)
  if (q.type) where.push(Prisma.sql`p.type = ${q.type}`)
  if (q.seal) where.push(Prisma.sql`p.seal = ${q.seal}`)
  if (q.acessivelPara) {
    where.push(Prisma.sql`(p.category_approval ->> ${q.acessivelPara})::float8 >= 0.75`)
  }

  const whereSql = where.length ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.empty

  return Prisma.sql`
    SELECT ${PLACE_COLUMNS}, ${distance} AS distance
    FROM places p
    ${whereSql}
    ORDER BY ${order}
    LIMIT ${q.limit}`
}
