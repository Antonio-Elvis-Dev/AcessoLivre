/**
 * Selo de acessibilidade (RF03).
 *
 * Regras (README, seção 10):
 * 1. Só conta a avaliação vigente de cada usuário; "Não sei" é ignorado.
 * 2. Peso de cada resposta = recência × votos.
 *    - Recência: cai pela metade a cada 6 meses.
 *    - Votos (RF04): 1 + 0,25 × confirmações − 0,5 × contestações, mínimo 0.
 * 3. Aprovação da categoria = Σ pesos "Sim" ÷ Σ pesos ("Sim" + "Não").
 * 4. Aprovação geral = média das categorias com respostas.
 * 5. Faixas: ≥ 75% acessível, 40–74% parcial, < 40% pouco acessível;
 *    menos de 3 avaliações = "poucas avaliações".
 */

export const SEAL_LEVELS = ['acessivel', 'parcial', 'pouco_acessivel', 'poucas_avaliacoes'] as const
export type SealLevel = (typeof SEAL_LEVELS)[number]

export const SEAL_CONFIG = {
  halfLifeDays: 182.5,
  confirmationBonus: 0.25,
  contestationPenalty: 0.5,
  minEvaluations: 3,
  accessibleThreshold: 0.75,
  partialThreshold: 0.4,
} as const

export const SEAL_INFO: Record<
  SealLevel,
  { label: string; regional: string; description: string; color: string; icon: string }
> = {
  acessivel: {
    label: 'Acessível',
    regional: 'Arretado de acessível!',
    description: 'A maioria das avaliações aprova a acessibilidade deste local.',
    color: '#1B7F3B',
    icon: 'check-circle',
  },
  parcial: {
    label: 'Parcialmente acessível',
    regional: 'Mais ou menos, visse?',
    description: 'O local tem alguns recursos de acessibilidade, mas falta melhorar.',
    color: '#8A5A00',
    icon: 'alert-circle',
  },
  pouco_acessivel: {
    label: 'Pouco acessível',
    regional: 'Oxe, aqui tá difícil!',
    description: 'As avaliações apontam muitas barreiras de acessibilidade.',
    color: '#B3261E',
    icon: 'close-circle',
  },
  poucas_avaliacoes: {
    label: 'Poucas avaliações',
    regional: 'Ainda falta gente avaliar',
    description: 'O local tem menos de 3 avaliações. Ajude avaliando!',
    color: '#5F6368',
    icon: 'help-circle',
  },
}

export interface SealAnswerInput {
  categorySlug: string
  questionKey: string
  value: 'sim' | 'nao' | 'nao_sei'
  evaluationCreatedAt: Date | string
  confirmations: number
  contestations: number
}

export interface QuestionResult {
  questionKey: string
  categorySlug: string
  yes: number
  no: number
  unknown: number
  /** 0 a 1, ou null se não há respostas Sim/Não */
  approval: number | null
}

export interface CategoryResult {
  slug: string
  approval: number | null
  answers: number
}

export interface SealResult {
  approval: number | null
  level: SealLevel
  evaluationCount: number
  categories: CategoryResult[]
  questions: QuestionResult[]
}

export function recencyWeight(createdAt: Date | string, now: Date = new Date()): number {
  const ageMs = now.getTime() - new Date(createdAt).getTime()
  const ageDays = Math.max(0, ageMs / 86_400_000)
  return Math.pow(0.5, ageDays / SEAL_CONFIG.halfLifeDays)
}

export function voteWeight(confirmations: number, contestations: number): number {
  return Math.max(
    0,
    1 +
      SEAL_CONFIG.confirmationBonus * confirmations -
      SEAL_CONFIG.contestationPenalty * contestations,
  )
}

export function sealLevel(approval: number | null, evaluationCount: number): SealLevel {
  if (evaluationCount < SEAL_CONFIG.minEvaluations || approval === null) return 'poucas_avaliacoes'
  if (approval >= SEAL_CONFIG.accessibleThreshold) return 'acessivel'
  if (approval >= SEAL_CONFIG.partialThreshold) return 'parcial'
  return 'pouco_acessivel'
}

export function computeSeal(
  answers: SealAnswerInput[],
  evaluationCount: number,
  categorySlugs: readonly string[],
  now: Date = new Date(),
): SealResult {
  const cat = new Map<string, { yes: number; no: number; answers: number }>()
  const q = new Map<string, QuestionResult & { yesW: number; noW: number }>()

  for (const a of answers) {
    let qr = q.get(a.questionKey)
    if (!qr) {
      qr = {
        questionKey: a.questionKey,
        categorySlug: a.categorySlug,
        yes: 0,
        no: 0,
        unknown: 0,
        approval: null,
        yesW: 0,
        noW: 0,
      }
      q.set(a.questionKey, qr)
    }
    if (a.value === 'nao_sei') {
      qr.unknown++
      continue
    }
    const w =
      recencyWeight(a.evaluationCreatedAt, now) * voteWeight(a.confirmations, a.contestations)
    const c = cat.get(a.categorySlug) ?? { yes: 0, no: 0, answers: 0 }
    c.answers++
    if (a.value === 'sim') {
      qr.yes++
      qr.yesW += w
      c.yes += w
    } else {
      qr.no++
      qr.noW += w
      c.no += w
    }
    cat.set(a.categorySlug, c)
  }

  const categories: CategoryResult[] = categorySlugs.map((slug) => {
    const c = cat.get(slug)
    const total = c ? c.yes + c.no : 0
    return { slug, approval: c && total > 0 ? c.yes / total : null, answers: c?.answers ?? 0 }
  })

  const withApproval = categories.filter((c) => c.approval !== null)
  const approval =
    withApproval.length > 0
      ? withApproval.reduce((s, c) => s + (c.approval as number), 0) / withApproval.length
      : null

  const questions: QuestionResult[] = [...q.values()].map(({ yesW, noW, ...rest }) => ({
    ...rest,
    approval: yesW + noW > 0 ? yesW / (yesW + noW) : null,
  }))

  return {
    approval,
    level: sealLevel(approval, evaluationCount),
    evaluationCount,
    categories,
    questions,
  }
}

/** Formata 0.8234 como "82%". */
export function formatApproval(approval: number | null | undefined): string {
  if (approval === null || approval === undefined) return 'sem dados'
  return `${Math.round(approval * 100)}%`
}
