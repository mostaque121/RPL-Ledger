import { describe, expect, it } from 'vitest'
import type { SalesFilters } from './filters'
import { effectiveFilters } from './view'

const filters: SalesFilters = {
  owner: 'mine',
  month: '2026-10',
  sellerId: 'reaz',
  rtoId: 'acmc',
  courseId: 'chc',
  source: 'Website',
  payment: 'due',
  state: 'open',
  rtoPay: 'due',
  search: 'smith',
}

describe('effectiveFilters', () => {
  it('ignores hidden filters but keeps month and search', () => {
    expect(effectiveFilters(filters, ['seller', 'payment'])).toEqual({
      ...filters,
      rtoId: 'all',
      courseId: 'all',
      source: 'all',
      state: 'all',
      rtoPay: 'all',
    })
  })
})
