import { describe, expect, it } from 'vitest'
import { buildTimeline, groupByDay, type TimelineInput } from './timeline'

const sale: TimelineInput['sale'] = {
  id: 's1',
  saleDate: '2026-10-01',
  sellerName: 'Reaz',
  courseFee: 160000,
  completedOn: '2026-10-10',
  cancelled: false,
  payments: [
    { id: 'p1', paidOn: '2026-10-01', amount: 40000, note: null },
    { id: 'p2', paidOn: '2026-10-10', amount: 120000, note: 'Final' },
  ],
  rtoPayments: [{ id: 'r1', paidOn: '2026-10-05', amount: 55000, agency: 'OS', note: null }],
  commission: null,
  summary: { fullyPaidOn: '2026-10-10' },
}

describe('buildTimeline', () => {
  it('lists every event newest first, in story order within a day', () => {
    const events = buildTimeline({
      sale,
      // 11:00 Sydney on 10 Oct (UTC+11)
      notes: [{ id: 'n1', body: 'Called', pinned: false, createdAt: '2026-10-10T00:00:00Z' }],
      tasks: [{ id: 't1', title: 'Ask for USI', dueOn: null, doneAt: '2026-10-03T01:00:00Z', createdAt: '2026-10-02T01:00:00Z' }],
      invoices: [],
    })
    expect(events.map((e) => e.kind)).toEqual([
      'note',
      'completed',
      'paid-in-full',
      'payment',
      'rto-payment',
      'task-done',
      'task-added',
      'payment',
      'created',
    ])
  })

  it('puts timestamps on the Sydney day', () => {
    const [note] = buildTimeline({
      sale: { ...sale, payments: [], rtoPayments: [], completedOn: null, summary: { fullyPaidOn: null } },
      // 23:30 UTC on 11 Oct is 10:30 on 12 Oct in Sydney
      notes: [{ id: 'n1', body: 'Late', pinned: false, createdAt: '2026-10-11T23:30:00Z' }],
      tasks: [],
      invoices: [],
    })
    expect(note.day).toBe('2026-10-12')
  })

  it('skips "paid in full" on a cancelled sale', () => {
    const events = buildTimeline({ sale: { ...sale, cancelled: true, completedOn: null }, notes: [], tasks: [], invoices: [] })
    expect(events.some((e) => e.kind === 'paid-in-full')).toBe(false)
  })
})

describe('groupByDay', () => {
  it('groups consecutive events by day', () => {
    const groups = groupByDay(buildTimeline({ sale, notes: [], tasks: [], invoices: [] }))
    expect(groups.map((g) => [g.day, g.events.length])).toEqual([
      ['2026-10-10', 3],
      ['2026-10-05', 1],
      ['2026-10-01', 2],
    ])
  })
})
