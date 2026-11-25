import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

export default fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'AcessoLivre API',
        description:
          'API do AcessoLivre: mapeamento colaborativo de acessibilidade urbana. Rotas marcadas com cadeado exigem o token JWT recebido no login (Authorization: Bearer <token>).',
        version: '0.1.0',
      },
      tags: [
        { name: 'auth', description: 'Cadastro e login' },
        { name: 'places', description: 'Locais e selo de acessibilidade' },
        { name: 'categories', description: 'Categorias e perguntas de avaliação' },
        { name: 'evaluations', description: 'Avaliações, fotos e votos' },
        { name: 'ranking', description: 'Ranking da comunidade' },
        { name: 'me', description: 'Dados do usuário (LGPD)' },
      ],
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })
})
