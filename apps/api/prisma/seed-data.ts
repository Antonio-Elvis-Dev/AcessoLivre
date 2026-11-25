import type { PrismaClient } from '@prisma/client'
import { CATEGORIES } from '@acessolivre/shared'

/** Cria ou atualiza categorias e perguntas a partir de packages/shared/src/categories.ts. */
export async function seedCategories(prisma: PrismaClient) {
  for (const [ci, c] of CATEGORIES.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        name: c.name,
        shortName: c.shortName,
        description: c.description,
        order: ci,
      },
      update: { name: c.name, shortName: c.shortName, description: c.description, order: ci },
    })
    for (const [qi, q] of c.questions.entries()) {
      const data = {
        categoryId: category.id,
        text: q.text,
        help: q.help ?? null,
        order: qi,
        active: q.active ?? true,
      }
      await prisma.question.upsert({
        where: { key: q.key },
        create: { key: q.key, ...data },
        update: data,
      })
    }
  }
}

/**
 * Locais de demonstração em Arapiraca (AL), para o mapa não começar vazio.
 * As coordenadas são APROXIMADAS. Para dados reais, rode `pnpm api osm:import`,
 * que importa os locais do OpenStreetMap.
 */
export const DEMO_PLACES = [
  {
    name: 'Prefeitura Municipal de Arapiraca',
    type: 'servico_publico',
    lat: -9.7523,
    lng: -36.6604,
    address: 'Centro, Arapiraca - AL',
  },
  {
    name: 'Praça Marques da Silva',
    type: 'lazer',
    lat: -9.7514,
    lng: -36.661,
    address: 'Centro, Arapiraca - AL',
  },
  {
    name: 'Catedral Nossa Senhora do Bom Conselho',
    type: 'religioso',
    lat: -9.7521,
    lng: -36.6617,
    address: 'Centro, Arapiraca - AL',
  },
  {
    name: 'Mercado Público de Arapiraca',
    type: 'comercio',
    lat: -9.753,
    lng: -36.658,
    address: 'Centro, Arapiraca - AL',
  },
  { name: 'Lago da Perucaba', type: 'lazer', lat: -9.768, lng: -36.645, address: 'Arapiraca - AL' },
  {
    name: 'Terminal Rodoviário de Arapiraca',
    type: 'transporte',
    lat: -9.7562,
    lng: -36.6527,
    address: 'Arapiraca - AL',
  },
  {
    name: 'Hospital Regional de Arapiraca',
    type: 'saude',
    lat: -9.7472,
    lng: -36.6502,
    address: 'Arapiraca - AL',
  },
  {
    name: 'IFAL - Campus Arapiraca',
    type: 'educacao',
    lat: -9.7395,
    lng: -36.6475,
    address: 'Arapiraca - AL',
  },
  {
    name: 'UFAL - Campus Arapiraca',
    type: 'educacao',
    lat: -9.7036,
    lng: -36.6884,
    address: 'Arapiraca - AL',
  },
  {
    name: 'Arapiraca Garden Shopping',
    type: 'comercio',
    lat: -9.749,
    lng: -36.6371,
    address: 'Arapiraca - AL',
  },
] as const

export async function seedDemoPlaces(prisma: PrismaClient) {
  let created = 0
  for (const p of DEMO_PLACES) {
    const result = await prisma.$executeRaw`
      INSERT INTO places (id, name, type, address, description, location, updated_at)
      SELECT gen_random_uuid(), ${p.name}, ${p.type}, ${p.address},
        'Local de demonstração (coordenadas aproximadas).',
        ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography, now()
      WHERE NOT EXISTS (SELECT 1 FROM places WHERE lower(name) = lower(${p.name}))`
    created += result
  }
  return created
}
