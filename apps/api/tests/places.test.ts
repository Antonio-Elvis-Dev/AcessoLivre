import { describe, expect, it } from 'vitest'
import { createPlace, createUser, useTestApp } from './helpers'

describe('locais', () => {
  const ctx = useTestApp()

  it('cadastra local e busca por raio, ordenado pela distância', async () => {
    const u = await createUser(ctx.app)
    await createPlace(ctx.app, u.token, { name: 'Perto', lat: -9.7525, lng: -36.6611 })
    await createPlace(ctx.app, u.token, { name: 'Médio', lat: -9.7555, lng: -36.6611 })
    await createPlace(ctx.app, u.token, { name: 'Longe (Maceió)', lat: -9.6658, lng: -35.7353 })

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/places?lat=-9.7524&lng=-36.6611&raio=1000',
    })
    expect(res.statusCode).toBe(200)
    const places = res.json()
    expect(places.map((p: { name: string }) => p.name)).toEqual(['Perto', 'Médio'])
    expect(places[0].distance).toBeLessThan(places[1].distance)
    expect(places[0]).toMatchObject({
      seal: 'poucas_avaliacoes',
      evaluationCount: 0,
      approval: null,
    })
  })

  it('busca pela área visível do mapa (bbox) e por nome', async () => {
    const u = await createUser(ctx.app)
    await createPlace(ctx.app, u.token, { name: 'Farmácia Central', type: 'saude' })
    await createPlace(ctx.app, u.token, { name: 'Banco do Povo', type: 'banco', lat: -9.76 })
    await createPlace(ctx.app, u.token, { name: 'Fora', lat: -9.9, lng: -36.9 })

    const bbox = await ctx.app.inject({ method: 'GET', url: '/places?bbox=-36.7,-9.8,-36.6,-9.7' })
    expect(bbox.json()).toHaveLength(2)

    const byName = await ctx.app.inject({ method: 'GET', url: '/places?q=farm' })
    expect(byName.json().map((p: { name: string }) => p.name)).toEqual(['Farmácia Central'])

    const byType = await ctx.app.inject({ method: 'GET', url: '/places?type=banco' })
    expect(byType.json()).toHaveLength(1)
  })

  it('valida bbox e coordenadas', async () => {
    expect((await ctx.app.inject({ method: 'GET', url: '/places?bbox=abc' })).statusCode).toBe(400)
    expect((await ctx.app.inject({ method: 'GET', url: '/places?lat=-9.7' })).statusCode).toBe(400)
    expect((await ctx.app.inject({ method: 'GET', url: '/places?lat=200&lng=0' })).statusCode).toBe(
      400,
    )
  })

  it('impede cadastrar o mesmo local duas vezes no mesmo lugar', async () => {
    const u = await createUser(ctx.app)
    await createPlace(ctx.app, u.token, { name: 'Padaria Boa Massa' })
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/places',
      headers: u.auth,
      payload: { name: 'padaria boa massa', type: 'alimentacao', lat: -9.75252, lng: -36.66112 },
    })
    expect(res.statusCode).toBe(409)
  })

  it('exige login para cadastrar e retorna 404 para local inexistente', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/places',
      payload: { name: 'X', type: 'outro', lat: 0, lng: 0 },
    })
    expect(res.statusCode).toBe(401)
    const missing = await ctx.app.inject({
      method: 'GET',
      url: '/places/00000000-0000-0000-0000-000000000000',
    })
    expect(missing.statusCode).toBe(404)
  })

  it('lista categorias e perguntas', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/categories' })
    expect(res.statusCode).toBe(200)
    const cats = res.json()
    expect(cats.map((c: { slug: string }) => c.slug)).toEqual([
      'mobilidade',
      'visual',
      'auditiva',
      'comunicacao_cognicao',
      'servicos',
    ])
    expect(cats[0].questions[0].key).toBe('mob_entrada_sem_degrau')
  })
})
