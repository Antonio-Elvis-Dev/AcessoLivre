import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type ListPlacesParams } from '../services/api'
import { useAuth } from '../store/auth'

export const queryKeys = {
  categories: ['categories'] as const,
  places: (p: ListPlacesParams) => ['places', p] as const,
  place: (id: string, userId?: string) => ['place', id, userId ?? 'anon'] as const,
  ranking: ['ranking'] as const,
  me: ['me'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.categories,
    staleTime: 60 * 60 * 1000,
  })
}

export function usePlaces(params: ListPlacesParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.places(params),
    queryFn: () => api.places(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

export function usePlace(id: string) {
  const userId = useAuth((s) => s.user?.id)
  return useQuery({ queryKey: queryKeys.place(id, userId), queryFn: () => api.place(id) })
}

export function useRanking() {
  return useQuery({ queryKey: queryKeys.ranking, queryFn: api.ranking })
}

export function useMe() {
  const token = useAuth((s) => s.token)
  return useQuery({ queryKey: queryKeys.me, queryFn: api.me, enabled: !!token })
}
