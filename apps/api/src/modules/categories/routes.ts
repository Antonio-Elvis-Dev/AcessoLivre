import { z } from 'zod'
import type { CategorySlug, CategoryView } from '@acessolivre/shared'
import type { AppInstance } from '../types'

const categoryView = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  shortName: z.string(),
  description: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      key: z.string(),
      text: z.string(),
      help: z.string().nullable(),
      order: z.number(),
    }),
  ),
})

export async function categoryRoutes(app: AppInstance) {
  app.get(
    '/',
    {
      schema: {
        tags: ['categories'],
        summary: 'Lista as categorias com as perguntas ativas (RF02)',
        response: { 200: z.array(categoryView) },
      },
    },
    async (_request, reply) => {
      const categories = await app.prisma.category.findMany({
        orderBy: { order: 'asc' },
        include: { questions: { where: { active: true }, orderBy: { order: 'asc' } } },
      })
      reply.header('Cache-Control', 'public, max-age=300')
      return categories.map((c): CategoryView => ({
        id: c.id,
        slug: c.slug as CategorySlug,
        name: c.name,
        shortName: c.shortName,
        description: c.description,
        questions: c.questions.map((q) => ({
          id: q.id,
          key: q.key,
          text: q.text,
          help: q.help,
          order: q.order,
        })),
      }))
    },
  )
}
