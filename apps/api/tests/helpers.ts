import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { buildApp, type App } from '../src/app'
import { loadEnv } from '../src/env'
import { seedCategories } from '../prisma/seed-data'

export const prisma = new PrismaClient()

/** Cria a app de teste e limpa o banco antes de cada teste. */
export function useTestApp() {
  const ctx = {} as { app: App }
  beforeAll(async () => {
    await seedCategories(prisma)
    ctx.app = await buildApp({ env: loadEnv(), prisma, logger: false })
    await ctx.app.ready()
  })
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE evaluation_votes, photos, answers, evaluations, places, users RESTART IDENTITY CASCADE',
    )
  })
  afterAll(async () => {
    await ctx.app.close()
  })
  return ctx
}

let counter = 0

export async function createUser(app: App, name = 'Pessoa Teste') {
  counter++
  const email = `pessoa${counter}-${Date.now()}@teste.com`
  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { name, email, password: 'senha-segura-123', acceptTerms: true },
  })
  if (res.statusCode !== 201) throw new Error(`register falhou: ${res.body}`)
  const body = res.json() as { token: string; user: { id: string } }
  return {
    token: body.token,
    id: body.user.id,
    email,
    auth: { authorization: `Bearer ${body.token}` },
  }
}

export async function createPlace(
  app: App,
  token: string,
  overrides: Partial<{ name: string; lat: number; lng: number; type: string }> = {},
) {
  const res = await app.inject({
    method: 'POST',
    url: '/places',
    headers: { authorization: `Bearer ${token}` },
    payload: {
      name: 'Lanchonete do Zé',
      type: 'alimentacao',
      lat: -9.7525,
      lng: -36.6611,
      ...overrides,
    },
  })
  if (res.statusCode !== 201) throw new Error(`createPlace falhou: ${res.body}`)
  return res.json() as { id: string }
}

export function evaluate(
  app: App,
  token: string,
  placeId: string,
  answers: Record<string, 'sim' | 'nao' | 'nao_sei'>,
  comment?: string,
) {
  return app.inject({
    method: 'POST',
    url: `/places/${placeId}/evaluations`,
    headers: { authorization: `Bearer ${token}` },
    payload: {
      answers: Object.entries(answers).map(([questionKey, value]) => ({ questionKey, value })),
      comment,
    },
  })
}
