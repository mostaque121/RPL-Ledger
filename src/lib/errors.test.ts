import { describe, expect, it } from 'vitest'
import { friendlyDbError, unwrap } from './errors'

describe('friendlyDbError', () => {
  it('maps known Postgres codes', () => {
    expect(friendlyDbError({ code: '23503', message: 'fk violation' })).toMatch(/used by other records/)
    expect(friendlyDbError({ code: '23505', message: 'dup' }, { '23505': 'That RTO already exists.' })).toBe(
      'That RTO already exists.',
    )
  })

  it('passes raised exceptions through', () => {
    expect(friendlyDbError({ code: 'P0001', message: 'Partners cannot be deleted' })).toBe('Partners cannot be deleted')
  })

  it('explains network failures', () => {
    expect(friendlyDbError({ message: 'TypeError: Failed to fetch' })).toMatch(/reach the server/)
  })
})

describe('unwrap', () => {
  it('returns data or throws a friendly error', () => {
    expect(unwrap({ data: 1, error: null })).toBe(1)
    expect(() => unwrap({ data: null, error: { code: '23503', message: 'x' } })).toThrow(/used by other records/)
  })
})
