import type { AnswerValue, CategorySlug, VoteType } from './categories'
import type { PlaceType } from './place-types'
import type { SealLevel } from './seal'

/** Formatos de resposta da API, usados pelo app. */

export interface PublicUser {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: PublicUser
}

export interface PlaceSummary {
  id: string
  name: string
  type: PlaceType
  address: string | null
  lat: number
  lng: number
  approval: number | null
  seal: SealLevel
  evaluationCount: number
  /** metros, quando a busca foi por lat/lng */
  distance?: number
}

export interface CategoryApproval {
  slug: CategorySlug
  name: string
  approval: number | null
  answers: number
}

export interface QuestionHighlight {
  questionKey: string
  text: string
  categorySlug: CategorySlug
  yes: number
  no: number
  approval: number | null
}

export interface EvaluationView {
  id: string
  author: { id: string; name: string }
  comment: string | null
  createdAt: string
  answers: { questionKey: string; value: AnswerValue }[]
  photos: { id: string; url: string }[]
  confirmations: number
  contestations: number
  /** voto do usuário logado nesta avaliação */
  myVote: VoteType | null
  isMine: boolean
}

export interface PlaceDetail extends PlaceSummary {
  description: string | null
  osmId: string | null
  createdAt: string
  categories: CategoryApproval[]
  /** recursos confirmados pela maioria (aprovação ≥ 75%) */
  highlights: QuestionHighlight[]
  /** barreiras apontadas pela maioria (aprovação < 40%) */
  barriers: QuestionHighlight[]
  evaluations: EvaluationView[]
  myEvaluationId: string | null
}

export interface QuestionView {
  id: string
  key: string
  text: string
  help: string | null
  order: number
}

export interface CategoryView {
  id: string
  slug: CategorySlug
  name: string
  shortName: string
  description: string
  questions: QuestionView[]
}

export interface RankingEntry {
  position: number
  userId: string
  name: string
  points: number
  evaluations: number
}

export interface RankingResponse {
  ranking: RankingEntry[]
  me: RankingEntry | null
}

export interface ApiError {
  message: string
  code?: string
  issues?: { path: string; message: string }[]
}
