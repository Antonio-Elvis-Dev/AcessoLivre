import { bboxAround, distanceMeters, formatDistance, timeAgo } from '../utils/geo'

describe('geo', () => {
  it('calcula distâncias', () => {
    const d = distanceMeters(
      { latitude: -9.7525, longitude: -36.6611 },
      { latitude: -9.7615, longitude: -36.6611 },
    )
    expect(d).toBeGreaterThan(990)
    expect(d).toBeLessThan(1010)
    expect(formatDistance(234)).toBe('230 m')
    expect(formatDistance(1530)).toBe('1,5 km')
  })

  it('arredonda a área de busca para não expor a posição exata', () => {
    expect(bboxAround({ latitude: -9.75251, longitude: -36.66113 }, 6)).toMatch(
      /^-?\d+\.\d{2}(,-?\d+\.\d{2}){3}$/,
    )
  })

  it('escreve o tempo em português', () => {
    const now = new Date('2026-12-01T12:00:00Z')
    expect(timeAgo('2026-11-28T12:00:00Z', now)).toBe('há 3 dias')
    expect(timeAgo('2026-12-01T11:59:50Z', now)).toBe('agora mesmo')
  })
})
