import type { PrismaClient } from '@prisma/client'
import { CATEGORY_SLUGS, computeSeal, type SealResult } from '@acessolivre/shared'

interface AnswerRow {
  category_slug: string
  question_key: string
  value: 'sim' | 'nao' | 'nao_sei'
  created_at: Date
  confirmations: number
  contestations: number
}

/** Calcula o selo de um local a partir das avaliações vigentes (README, seção 10). */
export async function computePlaceSeal(
  prisma: PrismaClient,
  placeId: string,
  now = new Date(),
): Promise<SealResult> {
  const [rows, evaluationCount] = await Promise.all([
    prisma.$queryRaw<AnswerRow[]>`
      SELECT c.slug AS category_slug, q.key AS question_key, a.value::text AS value, e.created_at,
        COALESCE(v.confirmations, 0)::int AS confirmations,
        COALESCE(v.contestations, 0)::int AS contestations
      FROM evaluations e
      JOIN answers a ON a.evaluation_id = e.id
      JOIN questions q ON q.id = a.question_id AND q.active
      JOIN categories c ON c.id = q.category_id
      LEFT JOIN (
        SELECT evaluation_id,
          COUNT(*) FILTER (WHERE type = 'confirma') AS confirmations,
          COUNT(*) FILTER (WHERE type = 'contesta') AS contestations
        FROM evaluation_votes GROUP BY evaluation_id
      ) v ON v.evaluation_id = e.id
      WHERE e.place_id = ${placeId}::uuid AND e.is_current`,
    prisma.evaluation.count({ where: { placeId, isCurrent: true } }),
  ])

  return computeSeal(
    rows.map((r) => ({
      categorySlug: r.category_slug,
      questionKey: r.question_key,
      value: r.value,
      evaluationCreatedAt: r.created_at,
      confirmations: r.confirmations,
      contestations: r.contestations,
    })),
    evaluationCount,
    CATEGORY_SLUGS,
    now,
  )
}

/** Recalcula e grava o cache do selo no local (usado pelo mapa e pela lista). */
export async function refreshPlaceSeal(prisma: PrismaClient, placeId: string) {
  const seal = await computePlaceSeal(prisma, placeId)
  const categoryApproval = Object.fromEntries(
    seal.categories.filter((c) => c.approval !== null).map((c) => [c.slug, c.approval]),
  )
  await prisma.place.update({
    where: { id: placeId },
    data: {
      approval: seal.approval,
      seal: seal.level,
      evaluationCount: seal.evaluationCount,
      categoryApproval,
    },
  })
  return seal
}
