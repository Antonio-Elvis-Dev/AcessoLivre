import { describe, expect, it } from 'vitest'
import { CATEGORY_SLUGS } from './categories'
import {
  computeSeal,
  formatApproval,
  recencyWeight,
  sealLevel,
  voteWeight,
  type SealAnswerInput,
} from './seal'

const now = new Date('2026-12-01T12:00:00Z')
const answer = (o: Partial<SealAnswerInput>): SealAnswerInput => ({
  categorySlug: 'mobilidade',
  questionKey: 'mob_entrada_sem_degrau',
  value: 'sim',
  evaluationCreatedAt: now,
  confirmations: 0,
  contestations: 0,
  ...o,
})

describe('pesos', () => {
  it('a recência cai pela metade a cada 6 meses', () => {
    expect(recencyWeight(now, now)).toBe(1)
    const sixMonthsAgo = new Date(now.getTime() - 182.5 * 86_400_000)
    expect(recencyWeight(sixMonthsAgo, now)).toBeCloseTo(0.5)
    const oneYearAgo = new Date(now.getTime() - 365 * 86_400_000)
    expect(recencyWeight(oneYearAgo, now)).toBeCloseTo(0.25)
  })

  it('confirmações aumentam e contestações reduzem o peso, nunca abaixo de zero', () => {
    expect(voteWeight(0, 0)).toBe(1)
    expect(voteWeight(4, 0)).toBe(2)
    expect(voteWeight(0, 1)).toBe(0.5)
    expect(voteWeight(0, 5)).toBe(0)
    expect(voteWeight(2, 1)).toBe(1)
  })
})

describe('faixas do selo', () => {
  it.each([
    [0.75, 3, 'acessivel'],
    [0.74, 3, 'parcial'],
    [0.4, 3, 'parcial'],
    [0.39, 5, 'pouco_acessivel'],
    [1, 2, 'poucas_avaliacoes'],
    [null, 10, 'poucas_avaliacoes'],
  ] as const)('aprovação %s com %s avaliações = %s', (approval, count, level) => {
    expect(sealLevel(approval, count)).toBe(level)
  })
})

describe('computeSeal', () => {
  it('ignora "Não sei" e calcula aprovação por categoria e geral', () => {
    const r = computeSeal(
      [
        answer({ value: 'sim' }),
        answer({ value: 'nao' }),
        answer({ value: 'nao_sei' }),
        answer({ categorySlug: 'visual', questionKey: 'vis_piso_tatil', value: 'sim' }),
      ],
      3,
      CATEGORY_SLUGS,
      now,
    )
    expect(r.categories.find((c) => c.slug === 'mobilidade')?.approval).toBe(0.5)
    expect(r.categories.find((c) => c.slug === 'visual')?.approval).toBe(1)
    expect(r.categories.find((c) => c.slug === 'auditiva')?.approval).toBeNull()
    expect(r.approval).toBe(0.75) // média de 0.5 e 1
    expect(r.level).toBe('acessivel')
    const q = r.questions.find((x) => x.questionKey === 'mob_entrada_sem_degrau')
    expect(q).toMatchObject({ yes: 1, no: 1, unknown: 1, approval: 0.5 })
  })

  it('avaliações recentes pesam mais que as antigas', () => {
    const old = new Date(now.getTime() - 365 * 86_400_000)
    const r = computeSeal(
      [answer({ value: 'nao', evaluationCreatedAt: old }), answer({ value: 'sim' })],
      3,
      CATEGORY_SLUGS,
      now,
    )
    // 1 / (1 + 0.25)
    expect(r.approval).toBeCloseTo(0.8)
  })

  it('avaliação muito contestada deixa de contar', () => {
    const r = computeSeal(
      [answer({ value: 'nao', contestations: 2 }), answer({ value: 'sim' })],
      3,
      CATEGORY_SLUGS,
      now,
    )
    expect(r.approval).toBe(1)
  })

  it('sem respostas Sim/Não não há aprovação', () => {
    const r = computeSeal([answer({ value: 'nao_sei' })], 5, CATEGORY_SLUGS, now)
    expect(r.approval).toBeNull()
    expect(r.level).toBe('poucas_avaliacoes')
  })

  it('formata o percentual', () => {
    expect(formatApproval(0.8234)).toBe('82%')
    expect(formatApproval(null)).toBe('sem dados')
  })
})
