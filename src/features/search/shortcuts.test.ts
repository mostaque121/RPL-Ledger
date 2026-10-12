import { describe, expect, it } from 'vitest'
import { matchShortcut } from './shortcuts'

const items = [
  { id: 'new-sale', shortcut: ['N'] },
  { id: 'help', shortcut: ['?'] },
  { id: 'go-sales', shortcut: ['G', 'S'] },
  { id: 'go-dashboard', shortcut: ['G', 'D'] },
  { id: 'no-key' },
]

describe('matchShortcut', () => {
  it('runs a single-key shortcut, any case', () => {
    expect(matchShortcut(items, 'n', null)).toEqual({ kind: 'run', item: items[0] })
    expect(matchShortcut(items, '?', null)).toEqual({ kind: 'run', item: items[1] })
  })

  it('waits after the first key of a sequence, then runs the second', () => {
    expect(matchShortcut(items, 'g', null)).toEqual({ kind: 'wait', prefix: 'G' })
    expect(matchShortcut(items, 's', 'G')).toEqual({ kind: 'run', item: items[2] })
    expect(matchShortcut(items, 'd', 'G')).toEqual({ kind: 'run', item: items[3] })
  })

  it('ignores unknown keys and unknown sequences', () => {
    expect(matchShortcut(items, 'x', null)).toEqual({ kind: 'none' })
    expect(matchShortcut(items, 'x', 'G')).toEqual({ kind: 'none' })
    // A single-key shortcut doesn't fire as the second key of a sequence.
    expect(matchShortcut(items, 'n', 'G')).toEqual({ kind: 'none' })
  })
})
