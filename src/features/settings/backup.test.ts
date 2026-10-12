import { describe, expect, it } from 'vitest'
import { BACKUP_TABLES, contentsRows, tableRows, toCell, type BackupData } from './backup'

describe('backup', () => {
  it('keeps plain values and turns JSON into text', () => {
    expect(toCell('a')).toBe('a')
    expect(toCell(12.5)).toBe(12.5)
    expect(toCell(false)).toBe(false)
    expect(toCell(null)).toBeNull()
    expect(toCell(undefined)).toBeNull()
    expect(toCell([{ d: 'Fee', amount: 100 }])).toBe('[{"d":"Fee","amount":100}]')
  })

  it('writes a header with every column, then the rows in that order', () => {
    const rows = tableRows([
      { id: '1', amount: 100 },
      { id: '2', amount: 50, note: 'x' },
    ])
    expect(rows).toEqual([
      ['id', 'amount', 'note'],
      ['1', 100, null],
      ['2', 50, 'x'],
    ])
  })

  it('an empty table is just an empty sheet', () => {
    expect(tableRows([])).toEqual([[]])
  })

  it('lists every table with its row count', () => {
    const data = Object.fromEntries(BACKUP_TABLES.map((t) => [t, []])) as unknown as BackupData
    data.sales = [{ id: '1' }, { id: '2' }]
    const rows = contentsRows(data, '12 Oct 2026')
    expect(rows).toContainEqual(['sales', 2])
    expect(rows).toContainEqual(['payments', 0])
    expect(rows.filter((r) => typeof r[1] === 'number')).toHaveLength(BACKUP_TABLES.length)
  })
})
