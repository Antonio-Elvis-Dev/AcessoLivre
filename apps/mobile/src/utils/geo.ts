export const ARAPIRACA = { latitude: -9.7525, longitude: -36.6611 }

/** Distância em metros entre dois pontos (fórmula de haversine). */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`
}

/** Caixa (minLng,minLat,maxLng,maxLat) ao redor de um ponto, com ~`km` de lado. Arredondada para não expor a posição exata. */
export function bboxAround(c: { latitude: number; longitude: number }, km = 6): string {
  const dLat = km / 2 / 111
  const dLng = km / 2 / (111 * Math.cos((c.latitude * Math.PI) / 180))
  const r = (n: number) => n.toFixed(2)
  return [
    r(c.longitude - dLng),
    r(c.latitude - dLat),
    r(c.longitude + dLng),
    r(c.latitude + dLat),
  ].join(',')
}

export function bboxFromRegion(r: {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}): string {
  const r4 = (n: number) => n.toFixed(4)
  return [
    r4(r.longitude - r.longitudeDelta / 2),
    r4(r.latitude - r.latitudeDelta / 2),
    r4(r.longitude + r.longitudeDelta / 2),
    r4(r.latitude + r.latitudeDelta / 2),
  ].join(',')
}

/** "há 3 dias", "há 2 meses" */
export function timeAgo(iso: string, now = new Date()): string {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000)
  const units: [number, string, string][] = [
    [31_536_000, 'ano', 'anos'],
    [2_592_000, 'mês', 'meses'],
    [86_400, 'dia', 'dias'],
    [3_600, 'hora', 'horas'],
    [60, 'minuto', 'minutos'],
  ]
  for (const [secs, one, many] of units) {
    const n = Math.floor(s / secs)
    if (n >= 1) return `há ${n} ${n === 1 ? one : many}`
  }
  return 'agora mesmo'
}
