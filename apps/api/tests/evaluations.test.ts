import { describe, expect, it } from 'vitest'
import { createPlace, createUser, evaluate, prisma, useTestApp } from './helpers'

const ALL_YES = {
  mob_entrada_sem_degrau: 'sim',
  mob_porta_larga: 'sim',
  vis_piso_tatil: 'sim',
} as const
const ALL_NO = {
  mob_entrada_sem_degrau: 'nao',
  mob_porta_larga: 'nao',
  vis_piso_tatil: 'nao',
} as const

// PNG 1x1 válido
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

function multipart(buffer: Buffer, filename = 'foto.png', contentType = 'image/png') {
  const boundary = '----acessolivre'
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`,
    ),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  return { body, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
}

describe('avaliações, selo e votos', () => {
  const ctx = useTestApp()

  it('avalia um local e mostra o selo só depois de 3 avaliações', async () => {
    const [a, b, c] = [
      await createUser(ctx.app),
      await createUser(ctx.app),
      await createUser(ctx.app),
    ]
    const place = await createPlace(ctx.app, a.token)

    const r1 = await evaluate(ctx.app, a.token, place.id, ALL_YES, 'Tem rampa e porta larga!')
    expect(r1.statusCode).toBe(201)
    expect(r1.json().place).toMatchObject({
      seal: 'poucas_avaliacoes',
      evaluationCount: 1,
      approval: 1,
    })

    await evaluate(ctx.app, b.token, place.id, ALL_YES)
    const r3 = await evaluate(ctx.app, c.token, place.id, {
      ...ALL_YES,
      mob_porta_larga: 'nao_sei',
    })
    expect(r3.json().place).toMatchObject({ seal: 'acessivel', evaluationCount: 3, approval: 1 })

    const detail = await ctx.app.inject({
      method: 'GET',
      url: `/places/${place.id}`,
      headers: a.auth,
    })
    const d = detail.json()
    expect(d.seal).toBe('acessivel')
    expect(d.evaluations).toHaveLength(3)
    expect(d.myEvaluationId).toBe(r1.json().evaluation.id)
    expect(d.categories.find((x: { slug: string }) => x.slug === 'mobilidade').approval).toBe(1)
    expect(d.categories.find((x: { slug: string }) => x.slug === 'auditiva').approval).toBeNull()
    expect(d.highlights.map((h: { questionKey: string }) => h.questionKey)).toContain(
      'vis_piso_tatil',
    )
    expect(d.barriers).toHaveLength(0)

    // cache usado pelo mapa
    const list = await ctx.app.inject({ method: 'GET', url: '/places?seal=acessivel' })
    expect(list.json()).toHaveLength(1)
    const forVisual = await ctx.app.inject({ method: 'GET', url: '/places?acessivelPara=visual' })
    expect(forVisual.json()).toHaveLength(1)
    const forHearing = await ctx.app.inject({
      method: 'GET',
      url: '/places?acessivelPara=auditiva',
    })
    expect(forHearing.json()).toHaveLength(0)
  })

  it('nova avaliação do mesmo usuário substitui a anterior', async () => {
    const u = await createUser(ctx.app)
    const place = await createPlace(ctx.app, u.token)
    await evaluate(ctx.app, u.token, place.id, ALL_YES)
    const r2 = await evaluate(ctx.app, u.token, place.id, ALL_NO)
    expect(r2.json().place).toMatchObject({ evaluationCount: 1, approval: 0 })
    expect(await prisma.evaluation.count({ where: { placeId: place.id } })).toBe(2)
    expect(await prisma.evaluation.count({ where: { placeId: place.id, isCurrent: true } })).toBe(1)
  })

  it('recusa pergunta inexistente ou repetida e avaliação vazia', async () => {
    const u = await createUser(ctx.app)
    const place = await createPlace(ctx.app, u.token)
    expect((await evaluate(ctx.app, u.token, place.id, { nao_existe: 'sim' })).statusCode).toBe(400)
    expect((await evaluate(ctx.app, u.token, place.id, {})).statusCode).toBe(400)
    const dup = await ctx.app.inject({
      method: 'POST',
      url: `/places/${place.id}/evaluations`,
      headers: u.auth,
      payload: {
        answers: [
          { questionKey: 'vis_piso_tatil', value: 'sim' },
          { questionKey: 'vis_piso_tatil', value: 'nao' },
        ],
      },
    })
    expect(dup.statusCode).toBe(400)
  })

  it('confirma e contesta avaliações de outras pessoas, alterando o peso', async () => {
    const [a, b, c, d] = await Promise.all([1, 2, 3, 4].map(() => createUser(ctx.app)))
    const place = await createPlace(ctx.app, a!.token)
    const yes = (await evaluate(ctx.app, a!.token, place.id, ALL_YES)).json().evaluation.id
    const no = (await evaluate(ctx.app, b!.token, place.id, ALL_NO)).json().evaluation.id
    await evaluate(ctx.app, c!.token, place.id, { mob_entrada_sem_degrau: 'nao_sei' })

    // empate: 50%
    let detail = (await ctx.app.inject({ method: 'GET', url: `/places/${place.id}` })).json()
    expect(detail.approval).toBeCloseTo(0.5, 2)
    expect(detail.seal).toBe('parcial')

    // não pode votar na própria avaliação
    const own = await ctx.app.inject({
      method: 'POST',
      url: `/evaluations/${yes}/votes`,
      headers: a!.auth,
      payload: { type: 'confirma' },
    })
    expect(own.statusCode).toBe(403)

    // c e d contestam a avaliação negativa: peso dela vai a 0
    for (const u of [c!, d!]) {
      const r = await ctx.app.inject({
        method: 'POST',
        url: `/evaluations/${no}/votes`,
        headers: u.auth,
        payload: { type: 'contesta' },
      })
      expect(r.statusCode).toBe(200)
    }
    detail = (
      await ctx.app.inject({ method: 'GET', url: `/places/${place.id}`, headers: d!.auth })
    ).json()
    expect(detail.approval).toBeCloseTo(1, 2)
    const noView = detail.evaluations.find((e: { id: string }) => e.id === no)
    expect(noView).toMatchObject({ contestations: 2, confirmations: 0, myVote: 'contesta' })

    // trocar o voto atualiza em vez de duplicar
    const changed = await ctx.app.inject({
      method: 'POST',
      url: `/evaluations/${no}/votes`,
      headers: d!.auth,
      payload: { type: 'confirma' },
    })
    expect(changed.json()).toMatchObject({ confirmations: 1, contestations: 1, myVote: 'confirma' })

    const removed = await ctx.app.inject({
      method: 'DELETE',
      url: `/evaluations/${no}/votes`,
      headers: d!.auth,
    })
    expect(removed.json()).toMatchObject({ confirmations: 0, contestations: 1, myVote: null })
  })

  it('envia fotos com validação de dono, formato e limite', async () => {
    const [a, b] = [await createUser(ctx.app), await createUser(ctx.app)]
    const place = await createPlace(ctx.app, a.token)
    const evalId = (await evaluate(ctx.app, a.token, place.id, ALL_YES)).json().evaluation.id

    const ok = await ctx.app.inject({
      method: 'POST',
      url: `/evaluations/${evalId}/photos`,
      ...(() => {
        const m = multipart(PNG)
        return { payload: m.body, headers: { ...m.headers, ...a.auth } }
      })(),
    })
    expect(ok.statusCode).toBe(201)
    expect(ok.json().url).toMatch(/^http:\/\/api\.test\/uploads\/.+\.png$/)

    const served = await ctx.app.inject({ method: 'GET', url: new URL(ok.json().url).pathname })
    expect(served.statusCode).toBe(200)

    const m = multipart(PNG)
    const other = await ctx.app.inject({
      method: 'POST',
      url: `/evaluations/${evalId}/photos`,
      payload: m.body,
      headers: { ...m.headers, ...b.auth },
    })
    expect(other.statusCode).toBe(403)

    const fake = multipart(Buffer.from('<script>alert(1)</script>'), 'x.png')
    const bad = await ctx.app.inject({
      method: 'POST',
      url: `/evaluations/${evalId}/photos`,
      payload: fake.body,
      headers: { ...fake.headers, ...a.auth },
    })
    expect(bad.statusCode).toBe(400)

    for (let i = 0; i < 2; i++) {
      const mm = multipart(PNG)
      await ctx.app.inject({
        method: 'POST',
        url: `/evaluations/${evalId}/photos`,
        payload: mm.body,
        headers: { ...mm.headers, ...a.auth },
      })
    }
    const mm = multipart(PNG)
    const tooMany = await ctx.app.inject({
      method: 'POST',
      url: `/evaluations/${evalId}/photos`,
      payload: mm.body,
      headers: { ...mm.headers, ...a.auth },
    })
    expect(tooMany.statusCode).toBe(400)

    const detail = (await ctx.app.inject({ method: 'GET', url: `/places/${place.id}` })).json()
    expect(detail.evaluations[0].photos).toHaveLength(3)
  })

  it('apaga a própria avaliação e recalcula o selo', async () => {
    const [a, b] = [await createUser(ctx.app), await createUser(ctx.app)]
    const place = await createPlace(ctx.app, a.token)
    const id = (await evaluate(ctx.app, a.token, place.id, ALL_YES)).json().evaluation.id
    expect(
      (await ctx.app.inject({ method: 'DELETE', url: `/evaluations/${id}`, headers: b.auth }))
        .statusCode,
    ).toBe(403)
    expect(
      (await ctx.app.inject({ method: 'DELETE', url: `/evaluations/${id}`, headers: a.auth }))
        .statusCode,
    ).toBe(204)
    const detail = (await ctx.app.inject({ method: 'GET', url: `/places/${place.id}` })).json()
    expect(detail).toMatchObject({ evaluationCount: 0, approval: null })
  })
})
