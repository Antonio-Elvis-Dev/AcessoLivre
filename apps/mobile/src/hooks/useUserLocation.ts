import * as Location from 'expo-location'
import { useCallback, useState } from 'react'

export interface Coords {
  latitude: number
  longitude: number
}

/**
 * Localização do usuário, usada só no aparelho (LGPD): para centralizar o mapa e
 * calcular distâncias na lista. Nunca é enviada para a API.
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [denied, setDenied] = useState(false)
  const [loading, setLoading] = useState(false)

  const locate = useCallback(async (): Promise<Coords | null> => {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setDenied(true)
        return null
      }
      setDenied(false)
      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      setCoords(c)
      return c
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { coords, denied, loading, locate }
}
