import { describe, expect, it } from 'vitest'
import type { Invoice } from '@/features/invoices/api/invoices'
import type { Person } from '@/features/employees/api'
import type { SaleView } from '@/features/sales/api/sales'
import type { SaleTask } from '@/features/sales/api/tasks'
import { matches, searchRecords, tokenize } from './search'

// Only the fields the search reads.
const sale = (id: string, over: Partial<SaleView>): SaleView =>
  ({
    id,
    clientName: 'Client',
    phone: null,
    email: null,
    courseName: null,
    rtoName: null,
    sellerName: 'Tanvir',
    saleDate: '2026-10-01',
    ...over,
  }) as SaleView

const sales = [
  sale('sam', { clientName: 'Sam Lee', phone: '0412-345-678', courseName: 'CPC30220 Certificate III in Carpentry', saleDate: '2026-09-01' }),
  sale('samantha', { clientName: 'Samantha Ross', email: 'sam.r@example.com', saleDate: '2026-10-05' }),
  sale('ben', { clientName: 'Ben Samuels', rtoName: 'ACMC', sellerName: 'Reaz', saleDate: '2026-10-09' }),
  sale('jane', { clientName: 'Jane Doe', courseName: 'Diploma of Community Services', saleDate: '2026-08-01' }),
]

const ids = (list: { id: string }[]) => list.map((x) => x.id)

describe('matches', () => {
  it('needs every word, in any field and any order', () => {
    expect(matches(tokenize('carp sam'), ['Sam Lee', 'Certificate III in Carpentry'])).toBe(true)
    expect(matches(tokenize('sam plumbing'), ['Sam Lee', 'Certificate III in Carpentry'])).toBe(false)
  })

  it('ignores case and accents', () => {
    expect(matches(tokenize('JOSE'), ['José Núñez'])).toBe(true)
  })

  it('matches phone numbers whatever the spacing', () => {
    expect(matches(tokenize('0412 345'), ['0412-345-678'])).toBe(true)
    expect(matches(tokenize('0412345678'), ['0412 345 678'])).toBe(true)
    // Two digits are too few to treat as a phone number.
    expect(matches(tokenize('45'), ['0412-3-4-5'])).toBe(false)
  })

  it('an empty query matches everything', () => {
    expect(matches([], ['anything'])).toBe(true)
  })
})

describe('searchRecords', () => {
  it('finds nothing for an empty query', () => {
    const r = searchRecords('   ', { sales })
    expect(r.sales).toEqual({ items: [], total: 0 })
  })

  it('searches client, phone, email, course, RTO and seller', () => {
    expect(ids(searchRecords('carpentry', { sales }).sales.items)).toEqual(['sam'])
    expect(ids(searchRecords('0412 345', { sales }).sales.items)).toEqual(['sam'])
    expect(ids(searchRecords('example.com', { sales }).sales.items)).toEqual(['samantha'])
    expect(ids(searchRecords('acmc', { sales }).sales.items)).toEqual(['ben'])
    expect(ids(searchRecords('reaz', { sales }).sales.items)).toEqual(['ben'])
  })

  it('puts names starting with the query first, then the newest', () => {
    // "sam" starts Sam Lee and Samantha Ross (newest first), and is inside Ben Samuels (a later word).
    expect(ids(searchRecords('sam', { sales }).sales.items)).toEqual(['samantha', 'sam', 'ben'])
  })

  it('caps each kind and reports the full count', () => {
    const r = searchRecords('a', { sales }, 2)
    expect(r.sales.items).toHaveLength(2)
    expect(r.sales.total).toBe(4)
  })

  it('finds invoices by number or client, employees only (not partners), and tasks', () => {
    const invoices = [
      { id: 'i1', number: 'RFT-4528', saleClientName: 'Sam Lee', latest: { billToName: 'Sam Lee', issuedOn: '2026-10-01', items: [] } },
      { id: 'i2', number: 'RFT-4529', saleClientName: null, latest: { billToName: 'Acme', issuedOn: '2026-10-02', items: [] } },
    ] as unknown as Invoice[]
    const people = [
      { id: 'p1', name: 'Reaz', role: 'employee', active: true },
      { id: 'p2', name: 'Tanvir', role: 'partner', active: true },
    ] as Person[]
    const tasks = [
      { id: 't1', title: 'Ask for the USI', clientName: 'Sam Lee', doneAt: null, createdAt: '2026-10-01' },
      { id: 't2', title: 'Pay HubSpot', clientName: null, doneAt: null, createdAt: '2026-10-02' },
    ] as SaleTask[]

    expect(ids(searchRecords('4529', { invoices }).invoices.items)).toEqual(['i2'])
    expect(ids(searchRecords('sam', { invoices }).invoices.items)).toEqual(['i1'])
    expect(ids(searchRecords('tanvir', { people }).employees.items)).toEqual([])
    expect(ids(searchRecords('rea', { people }).employees.items)).toEqual(['p1'])
    expect(ids(searchRecords('usi', { tasks }).tasks.items)).toEqual(['t1'])
    expect(ids(searchRecords('sam lee', { tasks }).tasks.items)).toEqual(['t1'])
  })
})
