import Constants from 'expo-constants'
import type {
  ApiError,
  AuthResponse,
  CategoryView,
  CreateEvaluationInput,
  CreatePlaceInput,
  EvaluationView,
  LoginInput,
  PlaceDetail,
  PlaceSummary,
  PublicUser,
  RankingResponse,
  RegisterInput,
  SealLevel,
  VoteType,
} from '@acessolivre/shared'
import { useAuth } from '../store/auth'

/**
 * Endereço da API. Defina EXPO_PUBLIC_API_URL em apps/mobile/.env.
 * Sem ele, tenta o IP da máquina que roda o Metro (funciona no Expo Go na mesma rede).
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  return host ? `http://${host}:3333` : 'http://localhost:3333'
}

export const API_URL = resolveBaseUrl()

export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public issues?: ApiError['issues'],
  ) {
    super(message)
  }
}

type Query = Record<string, string | number | undefined | null>

function buildUrl(path: string, query?: Query) {
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  return API_URL + path + (params.length ? `?${params.join('&')}` : '')
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; query?: Query; form?: FormData } = {},
): Promise<T> {
  const token = useAuth.getState().token
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    })
  } catch {
    throw new RequestError(
      0,
      'Sem conexão com o servidor. Confira sua internet e tente de novo.',
      'NETWORK',
    )
  }

  if (res.status === 204) return undefined as T
  const data = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    const err = data as Partial<ApiError>
    if (res.status === 401 && token && err.code === 'UNAUTHORIZED')
      await useAuth.getState().signOut()
    throw new RequestError(
      res.status,
      err.message ?? 'Algo deu errado. Tente de novo.',
      err.code,
      err.issues,
    )
  }
  return data as T
}

export interface ListPlacesParams {
  bbox?: string
  q?: string
  type?: string
  seal?: SealLevel
  acessivelPara?: string
  limit?: number
}

export interface MeResponse {
  user: PublicUser & { termsAcceptedAt: string; termsVersion: string }
  stats: {
    points: number
    position: number | null
    evaluations: number
    photos: number
    votes: number
    places: number
  }
  evaluations: {
    id: string
    place: { id: string; name: string }
    comment: string | null
    isCurrent: boolean
    createdAt: string
    answers: { question: string; value: string }[]
    photos: string[]
  }[]
  votes: { evaluationId: string; type: string; createdAt: string }[]
  places: { id: string; name: string; createdAt: string }[]
}

export interface VoteResult {
  confirmations: number
  contestations: number
  myVote: VoteType | null
  place: { approval: number | null; seal: SealLevel }
}

export const api = {
  register: (body: RegisterInput) => request<AuthResponse>('POST', '/auth/register', { body }),
  login: (body: LoginInput) => request<AuthResponse>('POST', '/auth/login', { body }),

  categories: () => request<CategoryView[]>('GET', '/categories'),
  places: (query: ListPlacesParams) =>
    request<PlaceSummary[]>('GET', '/places', { query: { ...query } }),
  place: (id: string) => request<PlaceDetail>('GET', `/places/${id}`),
  createPlace: (body: CreatePlaceInput) => request<PlaceSummary>('POST', '/places', { body }),

  evaluate: (placeId: string, body: CreateEvaluationInput) =>
    request<{ evaluation: EvaluationView; place: { approval: number | null; seal: SealLevel } }>(
      'POST',
      `/places/${placeId}/evaluations`,
      { body },
    ),
  deleteEvaluation: (id: string) => request<void>('DELETE', `/evaluations/${id}`),
  uploadPhoto: (evaluationId: string, uri: string) => {
    const form = new FormData()
    // No React Native, o FormData aceita { uri, name, type } para enviar arquivos.
    form.append('photo', { uri, name: 'foto.jpg', type: 'image/jpeg' } as unknown as Blob)
    return request<{ id: string; url: string }>('POST', `/evaluations/${evaluationId}/photos`, {
      form,
    })
  },
  vote: (evaluationId: string, type: VoteType) =>
    request<VoteResult>('POST', `/evaluations/${evaluationId}/votes`, { body: { type } }),
  unvote: (evaluationId: string) =>
    request<VoteResult>('DELETE', `/evaluations/${evaluationId}/votes`),

  ranking: () => request<RankingResponse & { points: Record<string, number> }>('GET', '/ranking'),

  me: () => request<MeResponse>('GET', '/me'),
  updateMe: (name: string) => request<PublicUser>('PATCH', '/me', { body: { name } }),
  deleteMe: (password: string) => request<void>('DELETE', '/me', { body: { password } }),
}
