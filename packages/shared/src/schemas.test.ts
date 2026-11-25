import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './categories'
import { listPlacesQuerySchema, registerSchema } from './schemas'

describe('esquemas', () => {
  it('normaliza o e-mail no cadastro', () => {
    const r = registerSchema.parse({
      name: ' Lívia ',
      email: ' LIVIA@Teste.com ',
      password: '12345678',
      acceptTerms: true,
    })
    expect(r).toMatchObject({ name: 'Lívia', email: 'livia@teste.com' })
  })

  it('exige lat e lng juntos na busca', () => {
    expect(listPlacesQuerySchema.safeParse({ lat: '-9.75' }).success).toBe(false)
    expect(listPlacesQuerySchema.parse({ lat: '-9.75', lng: '-36.66' })).toMatchObject({
      raio: 2000,
      limit: 200,
    })
  })

  it('não repete keys de perguntas entre categorias', () => {
    const keys = CATEGORIES.flatMap((c) => c.questions.map((q) => q.key))
    expect(new Set(keys).size).toBe(keys.length)
  })
})
