import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { deleteMeSchema, updateMeSchema } from '@acessolivre/shared'
import { AppError, notFound } from '../../lib/errors'
import { getUserRanking } from '../../lib/points'
import { refreshPlaceSeal } from '../../lib/seal-service'
import type { AppInstance } from '../types'
import { errorSchema, publicUserSchema, toPublicUser } from '../users'

export async function meRoutes(app: AppInstance) {
  app.addHook('onRequest', app.authenticate)

  app.get(
    '/',
    {
      schema: {
        tags: ['me'],
        summary: 'Mostra todos os dados guardados sobre o usuário (LGPD, acesso e portabilidade)',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            user: publicUserSchema.extend({
              termsAcceptedAt: z.string(),
              termsVersion: z.string(),
            }),
            stats: z.object({
              points: z.number(),
              position: z.number().nullable(),
              evaluations: z.number(),
              photos: z.number(),
              votes: z.number(),
              places: z.number(),
            }),
            evaluations: z.array(
              z.object({
                id: z.string(),
                place: z.object({ id: z.string(), name: z.string() }),
                comment: z.string().nullable(),
                isCurrent: z.boolean(),
                createdAt: z.string(),
                answers: z.array(z.object({ question: z.string(), value: z.string() })),
                photos: z.array(z.string()),
              }),
            ),
            votes: z.array(
              z.object({ evaluationId: z.string(), type: z.string(), createdAt: z.string() }),
            ),
            places: z.array(z.object({ id: z.string(), name: z.string(), createdAt: z.string() })),
          }),
        },
      },
    },
    async (request) => {
      const user = await app.prisma.user.findUnique({
        where: { id: request.userId as string },
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            include: {
              place: { select: { id: true, name: true } },
              answers: { include: { question: { select: { text: true } } } },
              photos: true,
            },
          },
          votes: { orderBy: { createdAt: 'desc' } },
          places: { select: { id: true, name: true, createdAt: true } },
        },
      })
      if (!user) throw notFound('Usuário')
      const rank = await getUserRanking(app.prisma, user.id)

      return {
        user: {
          ...toPublicUser(user),
          termsAcceptedAt: user.termsAcceptedAt.toISOString(),
          termsVersion: user.termsVersion,
        },
        stats: {
          points: rank?.points ?? 0,
          position: rank?.position ?? null,
          evaluations: user.evaluations.filter((e) => e.isCurrent).length,
          photos: user.evaluations.reduce((s, e) => s + e.photos.length, 0),
          votes: user.votes.length,
          places: user.places.length,
        },
        evaluations: user.evaluations.map((e) => ({
          id: e.id,
          place: e.place,
          comment: e.comment,
          isCurrent: e.isCurrent,
          createdAt: e.createdAt.toISOString(),
          answers: e.answers.map((a) => ({ question: a.question.text, value: a.value })),
          photos: e.photos.map((p) => app.photoUrl(p.filename)),
        })),
        votes: user.votes.map((v) => ({
          evaluationId: v.evaluationId,
          type: v.type,
          createdAt: v.createdAt.toISOString(),
        })),
        places: user.places.map((p) => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt.toISOString(),
        })),
      }
    },
  )

  app.patch(
    '/',
    {
      schema: {
        tags: ['me'],
        summary: 'Altera o nome de exibição',
        security: [{ bearerAuth: [] }],
        body: updateMeSchema,
        response: { 200: publicUserSchema, 400: errorSchema },
      },
    },
    async (request) => {
      const user = await app.prisma.user.update({
        where: { id: request.userId as string },
        data: { name: request.body.name },
      })
      return toPublicUser(user)
    },
  )

  app.delete(
    '/',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        tags: ['me'],
        summary: 'Exclui a conta e todos os dados do usuário (LGPD). Exige a senha.',
        security: [{ bearerAuth: [] }],
        body: deleteMeSchema,
        response: { 204: z.null(), 401: errorSchema },
      },
    },
    async (request, reply) => {
      const userId = request.userId as string
      const user = await app.prisma.user.findUnique({ where: { id: userId } })
      if (!user) throw notFound('Usuário')
      if (!(await bcrypt.compare(request.body.password, user.passwordHash))) {
        throw new AppError(401, 'Senha incorreta.', 'INVALID_PASSWORD')
      }

      const evaluations = await app.prisma.evaluation.findMany({
        where: { userId },
        select: { placeId: true, photos: { select: { filename: true } } },
      })
      const votedPlaces = await app.prisma.evaluationVote.findMany({
        where: { userId },
        select: { evaluation: { select: { placeId: true } } },
      })
      const affected = new Set([
        ...evaluations.map((e) => e.placeId),
        ...votedPlaces.map((v) => v.evaluation.placeId),
      ])

      // Cascata no banco: avaliações, respostas, fotos e votos. Locais cadastrados ficam, sem autor.
      await app.prisma.user.delete({ where: { id: userId } })
      await Promise.all(
        evaluations.flatMap((e) => e.photos.map((p) => app.storage.remove(p.filename))),
      )
      for (const placeId of affected) await refreshPlaceSeal(app.prisma, placeId)

      return reply.status(204).send(null)
    },
  )
}
