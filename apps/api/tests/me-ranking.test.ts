import { describe, expect, it } from 'vitest'
import { createPlace, createUser, evaluate, prisma, useTestApp } from './helpers'

describe('meus dados (LGPD) e ranking', () => {
  const ctx = useTestApp()

  it('mostra os dados do usuário e permite mudar o nome', async () => {
    const u = await createUser(ctx.app, 'Ana')
    const place = await createPlace(ctx.app, u.token)
    await evaluate(ctx.app, u.token, place.id, { vis_piso_tatil: 'sim' }, 'Piso tátil novo')

    const me = (await ctx.app.inject({ method: 'GET', url: '/me', headers: u.auth })).json()
    expect(me.user).toMatchObject({ name: 'Ana', email: u.email })
    expect(me.user.termsVersion).toBeTruthy()
    expect(me.evaluations[0]).toMatchObject({ comment: 'Piso tátil novo', place: { id: place.id } })
    expect(me.evaluations[0].answers[0]).toEqual({ question: 'Tem piso tátil?', value: 'sim' })
    expect(me.stats).toMatchObject({ evaluations: 1, places: 1, points: 15, position: 1 })

    const patched = await ctx.app.inject({
      method: 'PATCH',
      url: '/me',
      headers: u.auth,
      payload: { name: 'Ana Clara' },
    })
    expect(patched.json().name).toBe('Ana Clara')
  })

  it('exclui a conta com a senha, apaga avaliações e recalcula o selo', async () => {
    const [a, b] = [await createUser(ctx.app), await createUser(ctx.app)]
    const place = await createPlace(ctx.app, a.token)
    await evaluate(ctx.app, a.token, place.id, { mob_entrada_sem_degrau: 'sim' })
    const bEval = (
      await evaluate(ctx.app, b.token, place.id, { mob_entrada_sem_degrau: 'nao' })
    ).json()
    await ctx.app.inject({
      method: 'POST',
      url: `/evaluations/${bEval.evaluation.id}/votes`,
      headers: a.auth,
      payload: { type: 'confirma' },
    })

    const wrong = await ctx.app.inject({
      method: 'DELETE',
      url: '/me',
      headers: a.auth,
      payload: { password: 'x' },
    })
    expect(wrong.statusCode).toBe(401)

    const del = await ctx.app.inject({
      method: 'DELETE',
      url: '/me',
      headers: a.auth,
      payload: { password: 'senha-segura-123' },
    })
    expect(del.statusCode).toBe(204)
    expect(await prisma.user.count({ where: { id: a.id } })).toBe(0)
    expect(await prisma.evaluationVote.count()).toBe(0)

    // o local continua, sem autor, e o selo só considera a avaliação de b
    const detail = (await ctx.app.inject({ method: 'GET', url: `/places/${place.id}` })).json()
    expect(detail).toMatchObject({ evaluationCount: 1, approval: 0 })

    // o token antigo deixa de funcionar
    expect((await ctx.app.inject({ method: 'GET', url: '/me', headers: a.auth })).statusCode).toBe(
      401,
    )
  })

  it('ordena o ranking pelos pontos de contribuição', async () => {
    const [a, b] = [await createUser(ctx.app, 'Ana'), await createUser(ctx.app, 'Bia')]
    await createUser(ctx.app, 'Sem pontos')
    const p1 = await createPlace(ctx.app, a.token, { name: 'Um' })
    const p2 = await createPlace(ctx.app, a.token, { name: 'Dois', lat: -9.76 })
    await evaluate(ctx.app, a.token, p1.id, { vis_piso_tatil: 'sim' })
    await evaluate(ctx.app, a.token, p2.id, { vis_piso_tatil: 'sim' })
    const be = (await evaluate(ctx.app, b.token, p1.id, { vis_piso_tatil: 'sim' })).json()
    await ctx.app.inject({
      method: 'POST',
      url: `/evaluations/${be.evaluation.id}/votes`,
      headers: a.auth,
      payload: { type: 'confirma' },
    })

    const res = (await ctx.app.inject({ method: 'GET', url: '/ranking', headers: b.auth })).json()
    // Ana: 2 locais (10) + 2 avaliações (20) + 1 voto (1) = 31; Bia: 10 + 2 (confirmação recebida) = 12
    expect(res.ranking.map((r: { name: string; points: number }) => [r.name, r.points])).toEqual([
      ['Ana', 31],
      ['Bia', 12],
    ])
    expect(res.me).toMatchObject({ name: 'Bia', position: 2 })
  })
})
