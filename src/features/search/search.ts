/**
 * What the command box finds. Pure (no React, no fetching), so it's tested.
 *
 * Every word typed must appear in the record (in any of its fields, any order), so
 * "sam carp" finds Sam Lee's Carpentry sale. A word of 3+ digits also matches phone
 * numbers with the spaces and dashes ignored ("0412 345" finds "0412-345-678").
 */
import type { Expense } from '@/features/expenses/api'
import type { Invoice } from '@/features/invoices/api/invoices'
import type { Person } from '@/features/employees/api'
import type { SaleView } from '@/features/sales/api/sales'
import type { SaleTask } from '@/features/sales/api/tasks'

export const normalize = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').trim()
const digits = (text: string) => text.replace(/\D/g, '')

/** The query split into lower-case words. */
export const tokenize = (query: string) => normalize(query).split(/\s+/).filter(Boolean)

/** Every word is in at least one field. */
export function matches(tokens: readonly string[], fields: readonly (string | null | undefined)[]): boolean {
  if (tokens.length === 0) return true
  const texts = fields.filter((f): f is string => !!f).map(normalize)
  const numbers = texts.map(digits)
  return tokens.every((t) => {
    if (texts.some((f) => f.includes(t))) return true
    const d = digits(t)
    return d.length >= 3 && d.length === t.replace(/[\s\-()+]/g, '').length && numbers.some((n) => n.includes(d))
  })
}

/** Higher when the main field (a name, a number) starts with what was typed. */
function score(tokens: readonly string[], primary: string): number {
  const p = normalize(primary)
  if (tokens.length > 0 && p.startsWith(tokens.join(' '))) return 2
  return tokens.some((t) => p.startsWith(t) || p.includes(` ${t}`)) ? 1 : 0
}

export interface Hits<T> {
  /** The best matches, at most `limit`. */
  items: T[]
  /** How many matched in all. */
  total: number
}

interface Ranked<T> {
  item: T
  score: number
  /** Later first among equal scores (ISO dates compare as text). */
  date: string
}

function rank<T>(ranked: Ranked<T>[], limit: number): Hits<T> {
  ranked.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date))
  return { items: ranked.slice(0, limit).map((r) => r.item), total: ranked.length }
}

function find<T>(
  rows: readonly T[],
  tokens: readonly string[],
  limit: number,
  fields: (row: T) => (string | null | undefined)[],
  primary: (row: T) => string,
  date: (row: T) => string,
): Hits<T> {
  const ranked: Ranked<T>[] = []
  for (const row of rows) {
    if (matches(tokens, fields(row))) ranked.push({ item: row, score: score(tokens, primary(row)), date: date(row) })
  }
  return rank(ranked, limit)
}

export interface SearchData {
  sales?: readonly SaleView[]
  invoices?: readonly Invoice[]
  people?: readonly Person[]
  tasks?: readonly SaleTask[]
  expenses?: readonly Expense[]
}

export interface SearchResults {
  sales: Hits<SaleView>
  invoices: Hits<Invoice>
  employees: Hits<Person>
  tasks: Hits<SaleTask>
  expenses: Hits<Expense>
}

const NONE = { items: [], total: 0 }

/**
 * Records matching the query, best first, `limit` per kind. An empty query finds nothing
 * (the box shows actions and pages instead). Data that hasn't loaded is skipped.
 */
export function searchRecords(query: string, data: SearchData, limit = 5): SearchResults {
  const tokens = tokenize(query)
  if (tokens.length === 0) return { sales: NONE, invoices: NONE, employees: NONE, tasks: NONE, expenses: NONE }

  return {
    sales: find(
      data.sales ?? [],
      tokens,
      limit,
      (s) => [s.clientName, s.phone, s.email, s.courseName, s.rtoName, s.sellerName],
      (s) => s.clientName,
      (s) => s.saleDate,
    ),
    invoices: find(
      data.invoices ?? [],
      tokens,
      limit,
      (i) => [i.number, i.latest.billToName, i.saleClientName, i.latest.items[0]?.description],
      (i) => i.number,
      (i) => i.latest.issuedOn,
    ),
    employees: find(
      (data.people ?? []).filter((p) => p.role === 'employee'),
      tokens,
      limit,
      (p) => [p.name],
      (p) => p.name,
      // Active people first among equal matches.
      (p) => (p.active ? '1' : '0'),
    ),
    tasks: find(
      data.tasks ?? [],
      tokens,
      limit,
      (t) => [t.title, t.clientName],
      (t) => t.title,
      // Open tasks before done ones, then the newest.
      (t) => `${t.doneAt ? 0 : 1}${t.createdAt}`,
    ),
    expenses: find(
      data.expenses ?? [],
      tokens,
      limit,
      (e) => [e.description, e.category, e.employeeName, e.saleClientName],
      (e) => e.description ?? e.employeeName ?? e.category,
      (e) => e.spentOn,
    ),
  }
}
