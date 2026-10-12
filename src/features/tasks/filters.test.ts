import { describe, expect, it } from 'vitest'
import { filterTasks, groupTasks, tabCounts, type TaskFilters, type TaskRow } from './filters'

const today = '2026-10-12'

const sale = {
  sellerId: 'reaz',
  sellerName: 'Reaz',
  rtoId: 'acmc',
  rtoName: 'ACMC',
  courseId: 'chc',
  courseName: 'CHC52021 Diploma of Community Services',
  paymentStatus: 'Partial' as const,
  cancelled: false,
}

const row = (id: string, over: Partial<TaskRow> = {}): TaskRow => ({
  id,
  saleId: 's1',
  clientName: 'Jane Smith',
  title: `Task ${id}`,
  dueOn: null,
  doneAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  sale,
  ...over,
})

const all: TaskFilters = { tab: 'all', link: 'all', sellerId: 'all', rtoId: 'all', courseId: 'all', payment: 'all', search: '' }

const rows = [
  row('late', { dueOn: '2026-10-10' }),
  row('today', { dueOn: today, clientName: 'Bob Lee', sale: { ...sale, sellerId: 'md', sellerName: 'MD', paymentStatus: 'Paid' } }),
  row('week', { dueOn: '2026-10-15', sale: { ...sale, rtoId: 'bard', rtoName: 'Bard' } }),
  row('later', { dueOn: '2026-12-01' }),
  row('none'),
  row('done', { dueOn: '2026-10-01', doneAt: '2026-10-02T00:00:00Z' }),
]

const ids = (list: TaskRow[]) => list.map((t) => t.id)

describe('filterTasks', () => {
  it('filters by tab: open, done', () => {
    expect(ids(filterTasks(rows, { ...all, tab: 'open' }, today))).not.toContain('done')
    expect(ids(filterTasks(rows, { ...all, tab: 'done' }, today))).toEqual(['done'])
  })

  it('filters open tasks by how urgent they are', () => {
    expect(ids(filterTasks(rows, { ...all, tab: 'overdue' }, today))).toEqual(['late'])
    expect(ids(filterTasks(rows, { ...all, tab: 'today' }, today))).toEqual(['today'])
    expect(ids(filterTasks(rows, { ...all, tab: 'soon' }, today))).toEqual(['week'])
  })

  it('never shows a done task under an urgency tab', () => {
    // `done` was due on 01 Oct, so it would be "overdue" if it were open.
    expect(ids(filterTasks(rows, { ...all, tab: 'overdue' }, today))).not.toContain('done')
  })

  it("filters by the sale's seller, RTO and payment status", () => {
    expect(ids(filterTasks(rows, { ...all, sellerId: 'md' }, today))).toEqual(['today'])
    expect(ids(filterTasks(rows, { ...all, rtoId: 'bard' }, today))).toEqual(['week'])
    expect(ids(filterTasks(rows, { ...all, payment: 'due' }, today))).not.toContain('today')
    expect(ids(filterTasks(rows, { ...all, payment: 'Paid' }, today))).toEqual(['today'])
  })

  it('searches the task, client, course, RTO and seller', () => {
    expect(ids(filterTasks(rows, { ...all, search: 'bob' }, today))).toEqual(['today'])
    expect(ids(filterTasks(rows, { ...all, search: 'TASK WEEK' }, today))).toEqual(['week'])
    expect(filterTasks(rows, { ...all, search: 'chc52021' }, today)).toHaveLength(rows.length)
  })

  it('treats a cancelled sale as having no payment status', () => {
    const cancelled = row('x', { sale: { ...sale, cancelled: true } })
    expect(filterTasks([cancelled], { ...all, payment: 'due' }, today)).toEqual([])
  })
})

describe('general tasks (no sale)', () => {
  const general = row('general', { saleId: null, clientName: null, sale: null, title: 'Pay HubSpot' })

  it('can be told apart from sale tasks', () => {
    expect(ids(filterTasks([...rows, general], { ...all, link: 'general' }, today))).toEqual(['general'])
    expect(ids(filterTasks([...rows, general], { ...all, link: 'sale' }, today))).not.toContain('general')
  })

  it('are searchable, and drop out of seller / RTO / course / payment filters', () => {
    expect(ids(filterTasks([general], { ...all, search: 'hubspot' }, today))).toEqual(['general'])
    expect(filterTasks([general], { ...all, sellerId: 'reaz' }, today)).toEqual([])
    expect(filterTasks([general], { ...all, payment: 'due' }, today)).toEqual([])
  })
})

describe('tabCounts', () => {
  it('counts each tab, ignoring the current tab', () => {
    expect(tabCounts(rows, { ...all, tab: 'done' }, today)).toEqual({ open: 5, overdue: 1, today: 1, soon: 1, done: 1, all: 6 })
  })

  it('applies the other filters', () => {
    expect(tabCounts(rows, { ...all, sellerId: 'md' }, today)).toEqual({ open: 1, overdue: 0, today: 1, soon: 0, done: 0, all: 1 })
  })
})

describe('groupTasks', () => {
  it('groups by urgency, then done, leaving out empty groups', () => {
    const groups = groupTasks([rows[4], rows[5], rows[0]], today)
    expect(groups.map((g) => [g.key, ids(g.tasks)])).toEqual([
      ['overdue', ['late']],
      ['none', ['none']],
      ['done', ['done']],
    ])
  })
})
