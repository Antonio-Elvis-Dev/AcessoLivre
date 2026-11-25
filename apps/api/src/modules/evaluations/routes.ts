import { z } from 'zod'
import { createEvaluationSchema } from '@acessolivre/shared'
import { badRequest, forbidden, notFound } from '../../lib/errors'
import { loadEvaluationViews } from '../../lib/evaluation-view'
import { refreshPlaceSeal } from '../../lib/seal-service'
import { detectImage } from '../../lib/storage'
import { evaluationViewSchema, idParams } from '../places/schemas'
import type { AppInstance } from '../types'
import { errorSchema } from '../users'

export const MAX_PHOTOS_PER_EVALUATION = 3

const sealSummary = z.object({
  approval: z.number().nullable(),
  seal: z.string(),
  evaluationCount: z.number(),
})

export async function evaluationRoutes(app: AppInstance) {
  app.post(
    '/places/:id/evaluations',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
      schema: {
        tags: ['evaluations'],
        summary: 'Envia uma avaliação do local (RF02). Substitui a avaliação anterior do usuário.',
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: createEvaluationSchema,
        response: {
          201: z.object({ evaluation: evaluationViewSchema, place: sealSummary }),
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const placeId = request.params.id
      const userId = request.userId as string
      const { answers, comment } = request.body

      const place = await app.prisma.place.findUnique({
        where: { id: placeId },
        select: { id: true },
      })
      if (!place) throw notFound('Local')

      const keys = [...new Set(answers.map((a) => a.questionKey))]
      if (keys.length !== answers.length)
        throw badRequest('Cada pergunta só pode ser respondida uma vez.')
      const questions = await app.prisma.question.findMany({
        where: { key: { in: keys }, active: true },
        select: { id: true, key: true },
      })
      if (questions.length !== keys.length) {
        const known = new Set(questions.map((q) => q.key))
        const unknown = keys.filter((k) => !known.has(k))
        throw badRequest(
          `Pergunta inválida ou desativada: ${unknown.join(', ')}.`,
          'INVALID_QUESTION',
        )
      }
      const idByKey = new Map(questions.map((q) => [q.key, q.id]))

      const evaluation = await app.prisma.$transaction(async (tx) => {
        await tx.evaluation.updateMany({
          where: { placeId, userId, isCurrent: true },
          data: { isCurrent: false },
        })
        return tx.evaluation.create({
          data: {
            placeId,
            userId,
            comment: comment || null,
            answers: {
              create: answers.map((a) => ({
                questionId: idByKey.get(a.questionKey) as string,
                value: a.value,
              })),
            },
          },
        })
      })

      const seal = await refreshPlaceSeal(app.prisma, placeId)
      const views = await loadEvaluationViews(app.prisma, placeId, userId, app.photoUrl, 100)
      const view = views.find((v) => v.id === evaluation.id)
      return reply.status(201).send({
        evaluation: view as NonNullable<typeof view>,
        place: { approval: seal.approval, seal: seal.level, evaluationCount: seal.evaluationCount },
      })
    },
  )

  app.delete(
    '/evaluations/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['evaluations'],
        summary: 'Apaga a própria avaliação',
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null(), 403: errorSchema, 404: errorSchema },
      },
    },
    async (request, reply) => {
      const evaluation = await app.prisma.evaluation.findUnique({
        where: { id: request.params.id },
        include: { photos: true },
      })
      if (!evaluation) throw notFound('Avaliação')
      if (evaluation.userId !== request.userId)
        throw forbidden('Você só pode apagar suas próprias avaliações.')

      await app.prisma.evaluation.delete({ where: { id: evaluation.id } })
      await Promise.all(evaluation.photos.map((p) => app.storage.remove(p.filename)))
      await refreshPlaceSeal(app.prisma, evaluation.placeId)
      return reply.status(204).send(null)
    },
  )

  app.post(
    '/evaluations/:id/photos',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
      schema: {
        tags: ['evaluations'],
        summary: `Envia uma foto da avaliação (multipart, campo "photo"; JPEG, PNG ou WebP; até ${MAX_PHOTOS_PER_EVALUATION} por avaliação)`,
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        params: idParams,
        response: {
          201: z.object({ id: z.string(), url: z.string() }),
          400: errorSchema,
          403: errorSchema,
          404: errorSchema,
          413: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const evaluation = await app.prisma.evaluation.findUnique({
        where: { id: request.params.id },
        include: { _count: { select: { photos: true } } },
      })
      if (!evaluation) throw notFound('Avaliação')
      if (evaluation.userId !== request.userId) {
        throw forbidden('Você só pode enviar fotos para suas próprias avaliações.')
      }
      if (evaluation._count.photos >= MAX_PHOTOS_PER_EVALUATION) {
        throw badRequest(
          `Cada avaliação pode ter no máximo ${MAX_PHOTOS_PER_EVALUATION} fotos.`,
          'TOO_MANY_PHOTOS',
        )
      }

      const file = await request.file()
      if (!file) throw badRequest('Envie a foto no campo "photo".', 'NO_FILE')
      const buffer = await file.toBuffer()
      const image = detectImage(buffer)
      if (!image)
        throw badRequest('Formato não aceito. Envie uma foto JPEG, PNG ou WebP.', 'INVALID_IMAGE')

      const filename = await app.storage.save(buffer, image.ext)
      const photo = await app.prisma.photo.create({
        data: { evaluationId: evaluation.id, filename },
      })
      return reply.status(201).send({ id: photo.id, url: app.photoUrl(filename) })
    },
  )
}
