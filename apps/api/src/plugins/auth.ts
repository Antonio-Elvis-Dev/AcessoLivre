import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../lib/errors'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string }
    user: { sub: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Exige um token válido de um usuário que ainda existe. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    /** Lê o token se houver; segue sem usuário se não houver. */
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    userId: string | null
  }
}

export default fp(
  async (app, opts: { secret: string; expiresIn: string }) => {
    await app.register(jwt, { secret: opts.secret, sign: { expiresIn: opts.expiresIn } })
    app.decorateRequest('userId', null)

    app.decorate('authenticate', async (request: FastifyRequest) => {
      try {
        await request.jwtVerify()
      } catch {
        throw new AppError(401, 'Faça login para continuar.', 'UNAUTHORIZED')
      }
      const exists = await app.prisma.user.count({ where: { id: request.user.sub } })
      if (!exists) throw new AppError(401, 'Sua sessão expirou. Entre novamente.', 'UNAUTHORIZED')
      request.userId = request.user.sub
    })

    app.decorate('optionalAuth', async (request: FastifyRequest) => {
      if (!request.headers.authorization) return
      try {
        await request.jwtVerify()
        request.userId = request.user.sub
      } catch {
        request.userId = null
      }
    })
  },
  { name: 'auth', dependencies: ['prisma'] },
)
