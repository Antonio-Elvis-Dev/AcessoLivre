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

/** Endereços que só funcionam no próprio PC ou no emulador, nunca num celular de verdade. */
const LOCAL_ONLY_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2', '0.0.0.0']

function hostOf(url: string): string {
  return url.replace(/^\w+:\/\//, '').split(/[:/]/)[0] ?? ''
}

/**
 * Endereço da API.
 * 1. Sem EXPO_PUBLIC_API_URL, usa o IP da máquina que roda o Metro (o mesmo que o Expo Go usa
 *    para baixar o app), então funciona no celular na mesma rede sem configurar nada.
 * 2. Com EXPO_PUBLIC_API_URL, usa o valor do .env. Se ele apontar para localhost ou 10.0.2.2
 *    (endereços que o celular não alcança) e o Expo souber o IP da máquina, usa esse IP.
 */
export function resolveBaseUrl(
  fromEnv: string | undefined = process.env.EXPO_PUBLIC_API_URL,
  hostUri: string | undefined = Constants.expoConfig?.hostUri,
): string {
  const metroHost = hostUri ? hostOf(hostUri) : undefined
  const usableMetroHost = metroHost && !LOCAL_ONLY_HOSTS.includes(metroHost) ? metroHost : undefined
  if (fromEnv) {
    const url = fromEnv.trim().replace(/\/$/, '')
    if (LOCAL_ONLY_HOSTS.includes(hostOf(url)) && usableMetroHost) {
      const port = url.match(/:(\d+)(?:\/|$)/)?.[1] ?? '3333'
      return `http://${usableMetroHost}:${port}`
    }
    return url
  }
  return usableMetroHost ? `http://${usableMetroHost}:3333` : 'http://localhost:3333'
}

export const API_URL = resolveBaseUrl()

if (__DEV__) console.log(`[api] usando ${API_URL}`)

/** Tempo máximo de espera por uma resposta antes de mostrar o erro de conexão. */
const TIMEOUT_MS = 15000

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
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      signal: controller.signal,
    })
  } catch (e) {
    if (__DEV__) console.warn(`[api] falha ao acessar ${API_URL}${path}:`, e)
    // Em desenvolvimento, mostra o endereço tentado para facilitar o diagnóstico.
    const hint = __DEV__ ? ` (endereço: ${API_URL})` : ''
    throw new RequestError(
      0,
      `Sem conexão com o servidor. Confira sua internet e tente de novo.${hint}`,
      'NETWORK',
    )
  } finally {
    clearTimeout(timer)
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
