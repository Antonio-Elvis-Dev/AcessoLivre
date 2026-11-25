import type { PrismaClient } from '@prisma/client'
import type { AnswerValue, EvaluationView, VoteType } from '@acessolivre/shared'

/** Monta as avaliações vigentes de um local no formato exibido pelo app. */
export async function loadEvaluationViews(
  prisma: PrismaClient,
  placeId: string,
  viewerId: string | null,
  photoUrl: (filename: string) => string,
  limit = 30,
): Promise<EvaluationView[]> {
  const evaluations = await prisma.evaluation.findMany({
    where: { placeId, isCurrent: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
      answers: { include: { question: { select: { key: true } } } },
      photos: { orderBy: { createdAt: 'asc' } },
      votes: { select: { userId: true, type: true } },
    },
  })

  return evaluations.map((e) => ({
    id: e.id,
    author: { id: e.user.id, name: e.user.name },
    comment: e.comment,
    createdAt: e.createdAt.toISOString(),
    answers: e.answers.map((a) => ({ questionKey: a.question.key, value: a.value as AnswerValue })),
    photos: e.photos.map((p) => ({ id: p.id, url: photoUrl(p.filename) })),
    confirmations: e.votes.filter((v) => v.type === 'confirma').length,
    contestations: e.votes.filter((v) => v.type === 'contesta').length,
    myVote: (e.votes.find((v) => v.userId === viewerId)?.type as VoteType | undefined) ?? null,
    isMine: e.userId === viewerId,
  }))
}
