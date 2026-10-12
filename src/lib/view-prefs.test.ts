import { describe, expect, it } from 'vitest'
import { defaultItems, moveItem, normalizeItems, toggleItem, visibleIds, type ViewItemDef } from './view-prefs'

const defs: ViewItemDef<'a' | 'b' | 'c' | 'd'>[] = [
  { id: 'a', label: 'A', required: true, defaultVisible: true },
  { id: 'b', label: 'B', defaultVisible: true },
  { id: 'c', label: 'C', defaultVisible: false },
  { id: 'd', label: 'D', defaultVisible: true },
]

describe('normalizeItems', () => {
  it('falls back to the defaults for missing or broken data', () => {
    expect(normalizeItems(null, defs)).toEqual(defaultItems(defs))
    expect(normalizeItems('nope', defs)).toEqual(defaultItems(defs))
  })

  it('keeps the stored order and choices, drops unknown and repeated ids', () => {
    const stored = [
      { id: 'd', visible: false },
      { id: 'zzz', visible: true },
      { id: 'c', visible: true },
      { id: 'b', visible: true },
      { id: 'a', visible: true },
      { id: 'c', visible: false },
    ]
    expect(normalizeItems(stored, defs)).toEqual([
      { id: 'd', visible: false },
      { id: 'c', visible: true },
      { id: 'b', visible: true },
      { id: 'a', visible: true },
    ])
  })

  it('keeps required items visible', () => {
    expect(normalizeItems([{ id: 'a', visible: false }], defs)[0]).toEqual({ id: 'a', visible: true })
  })

  it('slots new items in after the item before them', () => {
    // `c` was added since this was stored.
    const stored = [
      { id: 'b', visible: true },
      { id: 'a', visible: true },
      { id: 'd', visible: true },
    ]
    expect(normalizeItems(stored, defs).map((i) => i.id)).toEqual(['b', 'a', 'c', 'd'])
  })
})

describe('moveItem / toggleItem / visibleIds', () => {
  it('moves an item to another position', () => {
    expect(moveItem(defaultItems(defs), 'd', 'a').map((i) => i.id)).toEqual(['d', 'a', 'b', 'c'])
    expect(moveItem(defaultItems(defs), 'a', 'c').map((i) => i.id)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('toggles, but never hides a required item', () => {
    const items = toggleItem(toggleItem(defaultItems(defs), defs, 'c', true), defs, 'a', false)
    expect(visibleIds(items)).toEqual(['a', 'b', 'c', 'd'])
  })
})
