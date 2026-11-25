import { PrismaClient } from '@prisma/client'
import { seedCategories, seedDemoPlaces } from './seed-data'

const prisma = new PrismaClient()

async function main() {
  await seedCategories(prisma)
  console.log('✔ Categorias e perguntas atualizadas')

  if (process.env.SEED_DEMO_PLACES !== 'false') {
    const created = await seedDemoPlaces(prisma)
    console.log(
      `✔ ${created} locais de demonstração criados em Arapiraca (coordenadas aproximadas)`,
    )
    console.log('  Para importar locais reais do OpenStreetMap: pnpm api osm:import')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
