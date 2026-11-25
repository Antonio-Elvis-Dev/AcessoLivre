/**
 * Recalcula o selo de todos os locais. O peso de recência muda com o tempo,
 * então vale rodar uma vez por dia (cron) para o mapa refletir isso.
 */
import { PrismaClient } from '@prisma/client'
import { refreshPlaceSeal } from '../src/lib/seal-service'

const prisma = new PrismaClient()
const places = await prisma.place.findMany({
  where: { evaluationCount: { gt: 0 } },
  select: { id: true },
})
for (const p of places) await refreshPlaceSeal(prisma, p.id)
console.log(`✔ Selo recalculado em ${places.length} locais`)
await prisma.$disconnect()
