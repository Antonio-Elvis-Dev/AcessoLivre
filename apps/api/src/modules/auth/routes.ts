import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { loginSchema, registerSchema, TERMS_VERSION } from '@acessolivre/shared'
import { AppError, conflict } from '../../lib/errors'
import type { AppInstance } from '../types'
import { errorSchema, publicUserSchema, toPublicUser } from '../users'

const authResponse = z.object({ token: z.string(), user: publicUserSchema })
const authRateLimit = { rateLimit: { max: 10, timeWindow: '1 minute' } }

export async function authRoutes(app: AppInstance) {
  app.post(
    '/register',
    {
      config: authRateLimit,
      schema: {
        tags: ['auth'],
        summary: 'Cria uma conta (exige aceite do termo de uso e da política de privacidade)',
        body: registerSchema,
        response: { 201: authResponse, 400: errorSchema, 409: errorSchema },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body
      const existing = await app.prisma.user.findUnique({ where: { email } })
      if (existing) throw conflict('Já existe uma conta com este e-mail.', 'EMAIL_IN_USE')

      const user = await app.prisma.user.create({
        data: {
          name,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          termsAcceptedAt: new Date(),
          termsVersion: TERMS_VERSION,
        },
      })
      const token = await reply.jwtSign({ sub: user.id })
      return reply.status(201).send({ token, user: toPublicUser(user) })
    },
  )

  app.post(
    '/login',
    {
      config: authRateLimit,
      schema: {
        tags: ['auth'],
        summary: 'Entra com e-mail e senha e recebe o token JWT',
        body: loginSchema,
        response: { 200: authResponse, 401: errorSchema },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const user = await app.prisma.user.findUnique({ where: { email } })
      const ok = user && (await bcrypt.compare(password, user.passwordHash))
      if (!user || !ok)
        throw new AppError(401, 'E-mail ou senha incorretos.', 'INVALID_CREDENTIALS')
      const token = await reply.jwtSign({ sub: user.id })
      return { token, user: toPublicUser(user) }
    },
  )
}
