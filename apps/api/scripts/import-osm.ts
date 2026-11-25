/**
 * Importa locais de Arapiraca (ou outra cidade) do OpenStreetMap via Overpass API.
 *
 *   pnpm api osm:import                      # Arapiraca
 *   pnpm api osm:import -- --city "Penedo"   # outra cidade de Alagoas
 *   pnpm api osm:import -- --file dados.json # usa um JSON do Overpass já baixado
 *
 * Os locais são identificados pelo osm_id, então rodar de novo só atualiza nome,
 * tipo, endereço e posição, sem duplicar nem apagar avaliações.
 * Dados © colaboradores do OpenStreetMap, licença ODbL.
 */
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { PrismaClient } from '@prisma/client'
import { osmToPlace, type OsmElement } from './osm-mapping'

const { values } = parseArgs({
  options: {
    city: { type: 'string', default: 'Arapiraca' },
    state: { type: 'string', default: 'Alagoas' },
    file: { type: 'string' },
    endpoint: { type: 'string', default: 'https://overpass-api.de/api/interpreter' },
  },
})

const query = `
[out:json][timeout:120];
area["name"="${values.state}"]["admin_level"="4"]->.uf;
area["name"="${values.city}"]["admin_level"="8"](area.uf)->.a;
(
  nwr["name"]["amenity"](area.a);
  nwr["name"]["healthcare"](area.a);
  nwr["name"]["office"="government"](area.a);
  nwr["name"]["shop"~"^(supermarket|mall|department_store)$"](area.a);
  nwr["name"]["leisure"~"^(park|sports_centre|stadium)$"](area.a);
  nwr["name"]["tourism"~"^(hotel|guest_house|museum)$"](area.a);
);
out center tags;`

async function loadElements(): Promise<OsmElement[]> {
  if (values.file) return JSON.parse(await readFile(values.file, 'utf8')).elements
  console.log(`Consultando o Overpass para ${values.city} - ${values.state}...`)
  const res = await fetch(values.endpoint as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'AcessoLivre/0.1',
    },
    body: new URLSearchParams({ data: query }),
  })
  if (!res.ok) throw new Error(`Overpass respondeu ${res.status}: ${await res.text()}`)
  return ((await res.json()) as { elements: OsmElement[] }).elements
}

const prisma = new PrismaClient()
const elements = await loadElements()
const places = elements.map(osmToPlace).filter((p) => p !== null)
let count = 0
for (const p of places) {
  await prisma.$executeRaw`
    INSERT INTO places (id, name, type, address, osm_id, location, updated_at)
    VALUES (gen_random_uuid(), ${p.name}, ${p.type}, ${p.address}, ${p.osmId},
      ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography, now())
    ON CONFLICT (osm_id) DO UPDATE SET
      name = EXCLUDED.name, type = EXCLUDED.type,
      address = COALESCE(EXCLUDED.address, places.address),
      location = EXCLUDED.location, updated_at = now()`
  count++
}
console.log(`✔ ${count} locais importados ou atualizados (de ${elements.length} elementos do OSM)`)
await prisma.$disconnect()
