import { z } from 'zod'
import {
  CATEGORY_BY_SLUG,
  createPlaceSchema,
  listPlacesQuerySchema,
  SEAL_CONFIG,
  type CategorySlug,
  type PlaceDetail,
  type QuestionHighlight,
} from '@acessolivre/shared'
import { conflict, notFound } from '../../lib/errors'
import { loadEvaluationViews } from '../../lib/evaluation-view'
import {
  buildListPlacesQuery,
  PLACE_COLUMNS,
  point,
  toPlaceSummary,
  type PlaceRow,
} from '../../lib/geo'
import { computePlaceSeal } from '../../lib/seal-service'
import type { AppInstance } from '../types'
import { errorSchema } from '../users'
import { idParams, placeDetailSchema, placeSummarySchema } from './schemas'

export async function placeRoutes(app: AppInstance) {
  app.get(
    '/',
    {
      schema: {
        tags: ['places'],
        summary: 'Lista locais com o selo resumido (RF01)',
        description:
          'Use `bbox` para a área visível do mapa, ou `lat`/`lng`/`raio` para buscar por proximidade (ordenado pela distância). Sem nenhum dos dois, lista os locais mais avaliados. Filtros: `q` (nome), `type`, `seal`, `acessivelPara` (categoria com aprovação ≥ 75%).',
        querystring: listPlacesQuerySchema,
        response: { 200: z.array(placeSummarySchema), 400: errorSchema },
      },
    },
    async (request) => {
      const rows = await app.prisma.$queryRaw<PlaceRow[]>(buildListPlacesQuery(request.query))
      return rows.map(toPlaceSummary)
    },
  )

  app.get(
    '/:id',
    {
      onRequest: [app.optionalAuth],
      schema: {
        tags: ['places'],
        summary: 'Detalhe do local: selo, aprovação por categoria, destaques e avaliações (RF03)',
        params: idParams,
        response: { 200: placeDetailSchema, 404: errorSchema },
      },
    },
    async (request) => {
      const { id } = request.params
      const [row] = await app.prisma.$queryRaw<PlaceRow[]>`
        SELECT ${PLACE_COLUMNS} FROM places p WHERE p.id = ${id}::uuid`
      if (!row) throw notFound('Local')

      const [seal, evaluations, questions] = await Promise.all([
        computePlaceSeal(app.prisma, id),
        loadEvaluationViews(app.prisma, id, request.userId, app.photoUrl),
        app.prisma.question.findMany({ select: { key: true, text: true } }),
      ])
      const questionText = new Map(questions.map((q) => [q.key, q.text]))

      const toHighlight = (q: (typeof seal.questions)[number]): QuestionHighlight => ({
        questionKey: q.questionKey,
        text: questionText.get(q.questionKey) ?? q.questionKey,
        categorySlug: q.categorySlug as CategorySlug,
        yes: q.yes,
        no: q.no,
        approval: q.approval,
      })
      const answered = seal.questions.filter((q) => q.approval !== null)
      const byApproval = (a: { approval: number | null }, b: { approval: number | null }) =>
        (b.approval ?? 0) - (a.approval ?? 0)

      const summary = toPlaceSummary(row)
      const detail: PlaceDetail = {
        ...summary,
        // Valores recém-calculados (o cache do mapa pode estar alguns dias atrás por causa da recência)
        approval: seal.approval,
        seal: seal.level,
        evaluationCount: seal.evaluationCount,
        description: row.description,
        osmId: row.osm_id,
        createdAt: row.created_at.toISOString(),
        categories: seal.categories.map((c) => ({
          slug: c.slug as CategorySlug,
          name: CATEGORY_BY_SLUG[c.slug as CategorySlug].name,
          approval: c.approval,
          answers: c.answers,
        })),
        highlights: answered
          .filter((q) => (q.approval as number) >= SEAL_CONFIG.accessibleThreshold)
          .sort(byApproval)
          .map(toHighlight),
        barriers: answered
          .filter((q) => (q.approval as number) < SEAL_CONFIG.partialThreshold)
          .sort((a, b) => byApproval(b, a))
          .map(toHighlight),
        evaluations,
        myEvaluationId: evaluations.find((e) => e.isMine)?.id ?? null,
      }
      return detail
    },
  )

  app.post(
    '/',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
      schema: {
        tags: ['places'],
        summary: 'Cadastra um local novo',
        security: [{ bearerAuth: [] }],
        body: createPlaceSchema,
        response: { 201: placeSummarySchema, 400: errorSchema, 401: errorSchema, 409: errorSchema },
      },
    },
    async (request, reply) => {
      const { name, type, address, description, lat, lng } = request.body
      const location = point(lat, lng)

      // Evita duplicar o mesmo local: mesmo nome a menos de 50 metros.
      const [duplicate] = await app.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM places
        WHERE lower(name) = lower(${name}) AND ST_DWithin(location, ${location}, 50)
        LIMIT 1`
      if (duplicate) {
        throw conflict(`Este local já está cadastrado (id ${duplicate.id}).`, 'PLACE_EXISTS')
      }

      const [row] = await app.prisma.$queryRaw<PlaceRow[]>`
        WITH p AS (
          INSERT INTO places (id, name, type, address, description, location, created_by, updated_at)
          VALUES (gen_random_uuid(), ${name}, ${type}, ${address ?? null}, ${description ?? null},
            ${location}, ${request.userId}::uuid, now())
          RETURNING *
        )
        SELECT ${PLACE_COLUMNS} FROM p`
      return reply.status(201).send(toPlaceSummary(row as PlaceRow))
    },
  )
}
