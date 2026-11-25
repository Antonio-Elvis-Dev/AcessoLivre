import { z } from 'zod'
import { voteSchema } from '@acessolivre/shared'
import { badRequest, forbidden, notFound } from '../../lib/errors'
import { refreshPlaceSeal } from '../../lib/seal-service'
import { idParams } from '../places/schemas'
import type { AppInstance } from '../types'
import { errorSchema } from '../users'

const voteResult = z.object({
  confirmations: z.number(),
  contestations: z.number(),
  myVote: z.enum(['confirma', 'contesta']).nullable(),
  place: z.object({ approval: z.number().nullable(), seal: z.string() }),
})

export async function voteRoutes(app: AppInstance) {
  async function loadVotable(evaluationId: string, userId: string) {
    const evaluation = await app.prisma.evaluation.findUnique({ where: { id: evaluationId } })
    if (!evaluation) throw notFound('Avaliação')
    if (evaluation.userId === userId)
      throw forbidden('Você não pode votar na sua própria avaliação.')
    if (!evaluation.isCurrent) {
      throw badRequest(
        'Esta avaliação foi substituída por uma mais recente.',
        'EVALUATION_OUTDATED',
      )
    }
    return evaluation
  }

  async function result(evaluationId: string, placeId: string, userId: string) {
    const [votes, seal] = await Promise.all([
      app.prisma.evaluationVote.findMany({
        where: { evaluationId },
        select: { type: true, userId: true },
      }),
      refreshPlaceSeal(app.prisma, placeId),
    ])
    return {
      confirmations: votes.filter((v) => v.type === 'confirma').length,
      contestations: votes.filter((v) => v.type === 'contesta').length,
      myVote: votes.find((v) => v.userId === userId)?.type ?? null,
      place: { approval: seal.approval, seal: seal.level },
    }
  }

  app.post(
    '/evaluations/:id/votes',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 120, timeWindow: '1 hour' } },
      schema: {
        tags: ['evaluations'],
        summary:
          'Confirma ou contesta uma avaliação de outra pessoa (RF04). Votar de novo troca o voto.',
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: voteSchema,
        response: { 200: voteResult, 400: errorSchema, 403: errorSchema, 404: errorSchema },
      },
    },
    async (request) => {
      const userId = request.userId as string
      const evaluation = await loadVotable(request.params.id, userId)
      await app.prisma.evaluationVote.upsert({
        where: { evaluationId_userId: { evaluationId: evaluation.id, userId } },
        create: { evaluationId: evaluation.id, userId, type: request.body.type },
        update: { type: request.body.type },
      })
      return result(evaluation.id, evaluation.placeId, userId)
    },
  )

  app.delete(
    '/evaluations/:id/votes',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['evaluations'],
        summary: 'Retira o próprio voto de uma avaliação',
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: voteResult, 404: errorSchema },
      },
    },
    async (request) => {
      const userId = request.userId as string
      const evaluation = await app.prisma.evaluation.findUnique({
        where: { id: request.params.id },
      })
      if (!evaluation) throw notFound('Avaliação')
      await app.prisma.evaluationVote.deleteMany({ where: { evaluationId: evaluation.id, userId } })
      return result(evaluation.id, evaluation.placeId, userId)
    },
  )
}
