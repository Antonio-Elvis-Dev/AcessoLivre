import { Prisma, type PrismaClient } from '@prisma/client'
import type { RankingEntry } from '@acessolivre/shared'

/**
 * Pontuação da comunidade (RF05). Calculada a partir das contribuições, sem
 * contador separado, para não ficar inconsistente quando algo é apagado.
 */
export const POINTS = {
  evaluation: 10, // por local avaliado (avaliação vigente)
  photo: 3, // por foto enviada
  place: 5, // por local cadastrado
  vote: 1, // por confirmação/contestação feita
  confirmationReceived: 2, // por confirmação recebida em avaliação vigente
} as const

interface RankingRow {
  user_id: string
  name: string
  points: number
  evaluations: number
  position: bigint | number
}

function rankingSql(filter: Prisma.Sql, limit: number) {
  return Prisma.sql`
    WITH ev AS (SELECT user_id, COUNT(*) AS n FROM evaluations WHERE is_current GROUP BY user_id),
    ph AS (SELECT e.user_id, COUNT(*) AS n FROM photos p JOIN evaluations e ON e.id = p.evaluation_id GROUP BY e.user_id),
    pl AS (SELECT created_by AS user_id, COUNT(*) AS n FROM places WHERE created_by IS NOT NULL GROUP BY created_by),
    vo AS (SELECT user_id, COUNT(*) AS n FROM evaluation_votes GROUP BY user_id),
    cf AS (
      SELECT e.user_id, COUNT(*) AS n FROM evaluation_votes v
      JOIN evaluations e ON e.id = v.evaluation_id
      WHERE v.type = 'confirma' AND e.is_current GROUP BY e.user_id
    ),
    scored AS (
      SELECT u.id AS user_id, u.name, u.created_at,
        COALESCE(ev.n, 0)::int AS evaluations,
        (${POINTS.evaluation} * COALESCE(ev.n, 0) + ${POINTS.photo} * COALESCE(ph.n, 0)
          + ${POINTS.place} * COALESCE(pl.n, 0) + ${POINTS.vote} * COALESCE(vo.n, 0)
          + ${POINTS.confirmationReceived} * COALESCE(cf.n, 0))::int AS points
      FROM users u
      LEFT JOIN ev ON ev.user_id = u.id
      LEFT JOIN ph ON ph.user_id = u.id
      LEFT JOIN pl ON pl.user_id = u.id
      LEFT JOIN vo ON vo.user_id = u.id
      LEFT JOIN cf ON cf.user_id = u.id
    ),
    ranked AS (
      SELECT *, RANK() OVER (ORDER BY points DESC) AS position FROM scored WHERE points > 0
    )
    SELECT user_id, name, points, evaluations, position FROM ranked
    ${filter}
    ORDER BY position ASC, created_at ASC
    LIMIT ${limit}`
}

const toEntry = (r: RankingRow): RankingEntry => ({
  position: Number(r.position),
  userId: r.user_id,
  name: r.name,
  points: r.points,
  evaluations: r.evaluations,
})

export async function getRanking(prisma: PrismaClient, limit: number) {
  const rows = await prisma.$queryRaw<RankingRow[]>(rankingSql(Prisma.empty, limit))
  return rows.map(toEntry)
}

export async function getUserRanking(prisma: PrismaClient, userId: string) {
  const rows = await prisma.$queryRaw<RankingRow[]>(
    rankingSql(Prisma.sql`WHERE user_id = ${userId}::uuid`, 1),
  )
  return rows[0] ? toEntry(rows[0]) : null
}
