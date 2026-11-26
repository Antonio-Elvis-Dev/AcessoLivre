import { resolveBaseUrl } from '../services/api'

describe('resolveBaseUrl', () => {
  it('usa o IP do Metro quando não há .env', () => {
    expect(resolveBaseUrl(undefined, '192.168.1.20:8081')).toBe('http://192.168.1.20:3333')
  })

  it('respeita um IP de rede definido no .env', () => {
    expect(resolveBaseUrl('http://192.168.1.50:4000/', '192.168.1.20:8081')).toBe(
      'http://192.168.1.50:4000',
    )
  })

  it('troca 10.0.2.2 e localhost pelo IP do Metro, mantendo a porta', () => {
    expect(resolveBaseUrl('http://10.0.2.2:3333', '192.168.1.20:8081')).toBe(
      'http://192.168.1.20:3333',
    )
    expect(resolveBaseUrl('http://localhost:4000', '192.168.1.20:8081')).toBe(
      'http://192.168.1.20:4000',
    )
  })

  it('mantém o .env quando o Metro também é local', () => {
    expect(resolveBaseUrl('http://10.0.2.2:3333', 'localhost:8081')).toBe('http://10.0.2.2:3333')
  })

  it('cai em localhost sem .env e sem Metro', () => {
    expect(resolveBaseUrl(undefined, undefined)).toBe('http://localhost:3333')
  })
})
