import { z } from 'zod'
import { ANSWER_VALUES, CATEGORY_SLUGS, VOTE_TYPES } from './categories'
import { PLACE_TYPES } from './place-types'
import { SEAL_LEVELS } from './seal'

/** Esquemas de entrada compartilhados entre o app (validação de formulário) e a API. */

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 letras.')
    .max(60, 'Use no máximo 60 caracteres.'),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(254),
  password: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(72, 'A senha pode ter no máximo 72 caracteres.'),
  acceptTerms: z.literal(true, {
    error: 'É preciso aceitar o termo de uso e a política de privacidade.',
  }),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const updateMeSchema = z.object({
  name: registerSchema.shape.name,
})

export const deleteMeSchema = z.object({
  password: z.string().min(1, 'Confirme sua senha para excluir a conta.'),
})

export const latitude = z.coerce.number().min(-90).max(90)
export const longitude = z.coerce.number().min(-180).max(180)

export const createPlaceSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do local.').max(120),
  type: z.enum(PLACE_TYPES, { error: 'Escolha um tipo de local válido.' }),
  address: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  lat: latitude,
  lng: longitude,
})
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>

export const listPlacesQuerySchema = z
  .object({
    /** minLng,minLat,maxLng,maxLat (área visível do mapa) */
    bbox: z
      .string()
      .regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/, 'Use bbox=minLng,minLat,maxLng,maxLat')
      .optional(),
    lat: latitude.optional(),
    lng: longitude.optional(),
    /** raio em metros, usado com lat/lng */
    raio: z.coerce.number().int().min(50).max(50_000).default(2_000),
    q: z.string().trim().max(80).optional(),
    type: z.enum(PLACE_TYPES).optional(),
    seal: z.enum(SEAL_LEVELS).optional(),
    /** só locais com aprovação ≥ 75% nessa categoria */
    acessivelPara: z.enum(CATEGORY_SLUGS).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  })
  .refine((v) => (v.lat === undefined) === (v.lng === undefined), {
    message: 'Informe lat e lng juntos.',
    path: ['lat'],
  })
export type ListPlacesQuery = z.infer<typeof listPlacesQuerySchema>

export const createEvaluationSchema = z.object({
  answers: z
    .array(
      z.object({
        questionKey: z.string().min(1),
        value: z.enum(ANSWER_VALUES),
      }),
    )
    .min(1, 'Responda pelo menos uma pergunta.')
    .max(100),
  comment: z.string().trim().max(1000, 'Use no máximo 1000 caracteres.').optional(),
})
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>

export const voteSchema = z.object({
  type: z.enum(VOTE_TYPES),
})
export type VoteInput = z.infer<typeof voteSchema>
