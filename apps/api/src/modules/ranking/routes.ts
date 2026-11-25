import { z } from 'zod'
import { getRanking, getUserRanking, POINTS } from '../../lib/points'
import type { AppInstance } from '../types'

const entry = z.object({
  position: z.number(),
  userId: z.string(),
  name: z.string(),
  points: z.number(),
  evaluations: z.number(),
})

export async function rankingRoutes(app: AppInstance) {
  app.get(
    '/',
    {
      onRequest: [app.optionalAuth],
      schema: {
        tags: ['ranking'],
        summary: 'Ranking da comunidade (RF05)',
        description: `Pontos: ${POINTS.evaluation} por local avaliado, ${POINTS.photo} por foto, ${POINTS.place} por local cadastrado, ${POINTS.vote} por voto e ${POINTS.confirmationReceived} por confirmação recebida.`,
        querystring: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }),
        response: {
          200: z.object({
            ranking: z.array(entry),
            me: entry.nullable(),
            points: z.record(z.string(), z.number()),
          }),
        },
      },
    },
    async (request) => {
      const [ranking, me] = await Promise.all([
        getRanking(app.prisma, request.query.limit),
        request.userId ? getUserRanking(app.prisma, request.userId) : Promise.resolve(null),
      ])
      return { ranking, me, points: { ...POINTS } }
    },
  )
}
