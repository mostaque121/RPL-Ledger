import { useQuery } from '@tanstack/react-query'
import { useAppMutation } from '@/hooks/use-app-mutation'
import { unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

/** A managed list of names (RTOs, courses): add, rename, deactivate, delete when unused. */
export interface NamedItem {
  id: string
  name: string
  active: boolean
  /** How many sales use it. Only unused items can be deleted. */
  salesCount: number
}

export interface NamedItemUpdate {
  id: string
  name?: string
  active?: boolean
}

type NameListTable = 'rtos' | 'courses'

/**
 * Builds the query + mutation hooks for one name-list table.
 * `label` is used in messages, e.g. "An RTO with that name already exists."
 */
export function createNameListApi(table: NameListTable, label: { one: string; article: 'A' | 'An' }) {
  const keys = { all: [table] as const }
  const title = label.one.charAt(0).toUpperCase() + label.one.slice(1)
  const duplicate = { '23505': `${label.article} ${label.one} with that name already exists.` }
  // Plain `from(table)` on a union loses PostgREST's types; both tables share one row shape.
  const from = () => supabase.from(table as 'rtos')

  async function fetchAll(): Promise<NamedItem[]> {
    const rows = unwrap(await from().select('id, name, active, sales(count)').order('name'))
    return rows.map((r) => ({ id: r.id, name: r.name, active: r.active, salesCount: r.sales[0]?.count ?? 0 }))
  }

  /** Resolves with the new item's id. */
  async function create(name: string): Promise<string> {
    const inserted = await from().insert({ name: name.trim() }).select('id').single()
    return unwrap(inserted, duplicate).id
  }

  async function update({ id, name, active }: NamedItemUpdate) {
    unwrap(await from().update({ name: name?.trim(), active }).eq('id', id), duplicate)
  }

  async function remove(id: string) {
    unwrap(await from().delete().eq('id', id), {
      '23503': `This ${label.one} is used by sales. Deactivate it instead.`,
    })
  }

  return {
    keys,
    /** All items, A→Z. Filter on `active` for pickers. */
    useListQuery: () => useQuery({ queryKey: keys.all, queryFn: fetchAll }),
    useCreateMutation: () =>
      useAppMutation({ mutationFn: create, invalidate: [keys.all], success: (_, name) => `${name.trim()} added` }),
    useUpdateMutation: () =>
      useAppMutation({ mutationFn: update, invalidate: [keys.all], success: `${title} updated` }),
    useDeleteMutation: () =>
      useAppMutation({ mutationFn: remove, invalidate: [keys.all], success: `${title} removed` }),
  }
}

export type NameListApi = ReturnType<typeof createNameListApi>
