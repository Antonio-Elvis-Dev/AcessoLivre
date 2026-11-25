import { z } from 'zod'
import {
  ANSWER_VALUES,
  CATEGORY_SLUGS,
  PLACE_TYPES,
  SEAL_LEVELS,
  VOTE_TYPES,
} from '@acessolivre/shared'

export const placeSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(PLACE_TYPES),
  address: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  approval: z.number().nullable().describe('Aprovação geral de 0 a 1'),
  seal: z.enum(SEAL_LEVELS),
  evaluationCount: z.number(),
  distance: z.number().optional().describe('Distância em metros (busca por lat/lng)'),
})

export const evaluationViewSchema = z.object({
  id: z.string(),
  author: z.object({ id: z.string(), name: z.string() }),
  comment: z.string().nullable(),
  createdAt: z.string(),
  answers: z.array(z.object({ questionKey: z.string(), value: z.enum(ANSWER_VALUES) })),
  photos: z.array(z.object({ id: z.string(), url: z.string() })),
  confirmations: z.number(),
  contestations: z.number(),
  myVote: z.enum(VOTE_TYPES).nullable(),
  isMine: z.boolean(),
})

const questionHighlight = z.object({
  questionKey: z.string(),
  text: z.string(),
  categorySlug: z.enum(CATEGORY_SLUGS),
  yes: z.number(),
  no: z.number(),
  approval: z.number().nullable(),
})

export const placeDetailSchema = placeSummarySchema.extend({
  description: z.string().nullable(),
  osmId: z.string().nullable(),
  createdAt: z.string(),
  categories: z.array(
    z.object({
      slug: z.enum(CATEGORY_SLUGS),
      name: z.string(),
      approval: z.number().nullable(),
      answers: z.number(),
    }),
  ),
  highlights: z.array(questionHighlight),
  barriers: z.array(questionHighlight),
  evaluations: z.array(evaluationViewSchema),
  myEvaluationId: z.string().nullable(),
})

export const idParams = z.object({ id: z.string().uuid('Identificador inválido.') })
