import { describe, expect, it } from 'vitest'
import { createUser, prisma, useTestApp } from './helpers'

describe('autenticação', () => {
  const ctx = useTestApp()

  it('cadastra com aceite dos termos e não expõe a senha', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Carlos',
        email: 'Carlos@Teste.com',
        password: 'cadeirante123',
        acceptTerms: true,
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.token).toBeTypeOf('string')
    expect(body.user).toMatchObject({ name: 'Carlos', email: 'carlos@teste.com' })
    expect(JSON.stringify(body)).not.toContain('password')

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'carlos@teste.com' } })
    expect(user.passwordHash).not.toBe('cadeirante123')
    expect(user.termsVersion).toBeTruthy()
  })

  it('recusa cadastro sem aceitar os termos', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Maria',
        email: 'maria@teste.com',
        password: 'andador123',
        acceptTerms: false,
      },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().message).toMatch(/aceitar o termo/)
  })

  it('recusa e-mail repetido', async () => {
    const u = await createUser(ctx.app)
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { name: 'Outra', email: u.email, password: 'qualquer123', acceptTerms: true },
    })
    expect(res.statusCode).toBe(409)
  })

  it('faz login e recusa senha errada', async () => {
    const u = await createUser(ctx.app)
    const ok = await ctx.app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: u.email, password: 'senha-segura-123' },
    })
    expect(ok.statusCode).toBe(200)
    expect(ok.json().token).toBeTypeOf('string')

    const bad = await ctx.app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: u.email, password: 'errada' },
    })
    expect(bad.statusCode).toBe(401)
    expect(bad.json().message).toBe('E-mail ou senha incorretos.')
  })

  it('exige token nas rotas protegidas', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/me' })
    expect(res.statusCode).toBe(401)
  })
})
