import { describe, expect, it } from 'vitest'
import { dueLabel, sortNotes, sortTasks, taskDue, tasksNeedingAttention } from './crm'

const today = '2026-10-12'

const task = (id: string, dueOn: string | null, doneAt: string | null = null, createdAt = '2026-10-01T00:00:00Z') => ({
  id,
  dueOn,
  doneAt,
  createdAt,
})

describe('taskDue', () => {
  it('classifies by days until due', () => {
    expect(taskDue(null, today)).toBe('none')
    expect(taskDue('2026-10-11', today)).toBe('overdue')
    expect(taskDue('2026-10-12', today)).toBe('today')
    expect(taskDue('2026-10-19', today)).toBe('soon')
    expect(taskDue('2026-10-20', today)).toBe('later')
  })
})

describe('dueLabel', () => {
  it('reads like a person would say it', () => {
    expect(dueLabel('2026-10-09', today)).toBe('3 days overdue')
    expect(dueLabel('2026-10-11', today)).toBe('Yesterday')
    expect(dueLabel('2026-10-12', today)).toBe('Today')
    expect(dueLabel('2026-10-13', today)).toBe('Tomorrow')
    expect(dueLabel('2026-10-16', today)).toBe('In 4 days')
    expect(dueLabel('2026-11-05', today)).toBe('05 Nov 2026')
  })
})

describe('sortTasks', () => {
  it('puts open tasks first, soonest due first, undated last, then done (latest first)', () => {
    const sorted = sortTasks([
      task('done-old', '2026-10-01', '2026-10-02T00:00:00Z'),
      task('undated', null),
      task('later', '2026-11-01'),
      task('done-new', null, '2026-10-10T00:00:00Z'),
      task('overdue', '2026-10-05'),
    ])
    expect(sorted.map((t) => t.id)).toEqual(['overdue', 'later', 'undated', 'done-new', 'done-old'])
  })

  it('keeps tasks with the same due date in the order they were added', () => {
    const sorted = sortTasks([task('b', null, null, '2026-10-02T00:00:00Z'), task('a', null, null, '2026-10-01T00:00:00Z')])
    expect(sorted.map((t) => t.id)).toEqual(['a', 'b'])
  })
})

describe('tasksNeedingAttention', () => {
  it('keeps open tasks that are overdue or due within a week', () => {
    const list = tasksNeedingAttention(
      [task('soon', '2026-10-15'), task('later', '2026-12-01'), task('none', null), task('done', '2026-10-01', '2026-10-02T00:00:00Z'), task('late', '2026-10-01')],
      today,
    )
    expect(list.map((t) => t.id)).toEqual(['late', 'soon'])
  })
})

describe('sortNotes', () => {
  it('shows pinned notes first, then newest first', () => {
    const sorted = sortNotes([
      { id: 'old', pinned: false, createdAt: '2026-10-01T00:00:00Z' },
      { id: 'pinned-old', pinned: true, createdAt: '2026-09-01T00:00:00Z' },
      { id: 'new', pinned: false, createdAt: '2026-10-10T00:00:00Z' },
      { id: 'pinned-new', pinned: true, createdAt: '2026-10-05T00:00:00Z' },
    ])
    expect(sorted.map((n) => n.id)).toEqual(['pinned-new', 'pinned-old', 'new', 'old'])
  })
})
