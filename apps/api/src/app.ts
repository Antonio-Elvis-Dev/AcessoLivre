import path from 'node:path'
import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import type { PrismaClient } from '@prisma/client'
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { Env } from './env'
import { AppError } from './lib/errors'
import { getPrisma } from './lib/prisma'
import { LocalStorage } from './lib/storage'
import authPlugin from './plugins/auth'
import prismaPlugin from './plugins/prisma'
import swaggerPlugin from './plugins/swagger'
import { authRoutes } from './modules/auth/routes'
import { categoryRoutes } from './modules/categories/routes'
import { evaluationRoutes } from './modules/evaluations/routes'
import { meRoutes } from './modules/me/routes'
import { placeRoutes } from './modules/places/routes'
import { rankingRoutes } from './modules/ranking/routes'
import { voteRoutes } from './modules/votes/routes'

declare module 'fastify' {
  interface FastifyInstance {
    config: Env
    storage: LocalStorage
    /** Monta a URL pública de uma foto. */
    photoUrl: (filename: string) => string
  }
}

export interface BuildAppOptions {
  env: Env
  prisma?: PrismaClient
  logger?: boolean
}

export async function buildApp({ env, prisma, logger = true }: BuildAppOptions) {
  const app = Fastify({
    logger: logger
      ? { level: env.LOG_LEVEL ?? (env.NODE_ENV === 'production' ? 'info' : 'debug') }
      : false,
    trustProxy: true,
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  const uploadDir = path.resolve(env.UPLOAD_DIR)
  app.decorate('config', env)
  app.decorate('storage', new LocalStorage(uploadDir))
  app.decorate('photoUrl', (filename: string) => `${env.PUBLIC_URL ?? ''}/uploads/${filename}`)

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      const issues = error.validation.map((v) => ({
        path: v.instancePath.replace(/^\//, '').replaceAll('/', '.'),
        message: v.message ?? 'Valor inválido.',
      }))
      return reply.status(400).send({
        message: issues[0]?.message ?? 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        issues,
      })
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message, code: error.code })
    }
    if (error.statusCode === 429) {
      return reply
        .status(429)
        .send({
          message: 'Muitas tentativas. Espere um pouco e tente de novo.',
          code: 'RATE_LIMIT',
        })
    }
    if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({
        message: `A foto pode ter no máximo ${env.MAX_PHOTO_MB} MB.`,
        code: 'FILE_TOO_LARGE',
      })
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ message: error.message, code: error.code })
    }
    request.log.error(error)
    return reply.status(500).send({ message: 'Erro interno. Tente novamente.', code: 'INTERNAL' })
  })

  await app.register(prismaPlugin, { client: prisma ?? getPrisma(), disconnectOnClose: !prisma })
  await app.register(helmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } })
  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  })
  // Limites por rota (login, cadastro, envio de avaliações). Desligados nos testes automatizados.
  await app.register(rateLimit, { global: false, allowList: () => env.NODE_ENV === 'test' })
  await app.register(multipart, {
    limits: { fileSize: env.MAX_PHOTO_MB * 1024 * 1024, files: 1 },
  })
  await app.register(fastifyStatic, { root: uploadDir, prefix: '/uploads/', decorateReply: false })
  await app.register(authPlugin, { secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN })
  await app.register(swaggerPlugin)

  app.get('/health', { schema: { hide: true } }, async () => ({ status: 'ok' }))

  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(categoryRoutes, { prefix: '/categories' })
  await app.register(placeRoutes, { prefix: '/places' })
  await app.register(evaluationRoutes)
  await app.register(voteRoutes)
  await app.register(rankingRoutes, { prefix: '/ranking' })
  await app.register(meRoutes, { prefix: '/me' })

  return app
}

export type App = Awaited<ReturnType<typeof buildApp>>
