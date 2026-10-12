import { useQuery } from '@tanstack/react-query'
import { useAppMutation } from '@/hooks/use-app-mutation'
import type { IsoDate } from '@/lib/accounting'
import { unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

export interface SaleTask {
  id: string
  /** Null = a general task, not about any one sale. */
  saleId: string | null
  /** The sale's client, for lists outside the sale page. Null for a general task. */
  clientName: string | null
  title: string
  dueOn: IsoDate | null
  /** Null while open. */
  doneAt: string | null
  createdAt: string
}

export const saleTaskKeys = { all: ['sale-tasks'] as const }

/** Every task on every sale (a handful per sale), so the dashboard and the sale page share one fetch. */
async function fetchTasks(): Promise<SaleTask[]> {
  const rows = unwrap(
    await supabase
      .from('sale_tasks')
      .select('id, sale_id, title, due_on, done_at, created_at, sale:sales(client_name)')
      .order('created_at'),
  )
  return rows.map((r) => ({
    id: r.id,
    saleId: r.sale_id,
    clientName: r.sale?.client_name ?? null,
    title: r.title,
    dueOn: r.due_on,
    doneAt: r.done_at,
    createdAt: r.created_at,
  }))
}

export function useSaleTasksQuery() {
  return useQuery({ queryKey: saleTaskKeys.all, queryFn: fetchTasks })
}

// ---------------------------------------------------------------- mutations

export interface TaskInput {
  /** Null = a general task. Only used when adding; editing keeps the link. */
  saleId: string | null
  /** Set to edit an existing task. */
  id?: string
  title: string
  dueOn: IsoDate | null
}

async function saveTask({ id, saleId, title, dueOn }: TaskInput) {
  const row = { title: title.trim(), due_on: dueOn }
  unwrap(
    await (id
      ? supabase.from('sale_tasks').update(row).eq('id', id)
      : supabase.from('sale_tasks').insert({ ...row, sale_id: saleId })),
  )
}

export function useSaveTaskMutation() {
  return useAppMutation({
    mutationFn: saveTask,
    invalidate: [saleTaskKeys.all],
    success: (_, v) => (v.id ? 'Task saved' : 'Task added'),
  })
}

async function setTaskDone({ id, done }: { id: string; done: boolean }) {
  unwrap(await supabase.from('sale_tasks').update({ done_at: done ? new Date().toISOString() : null }).eq('id', id))
}

/** No toast: the tick itself is the feedback. */
export function useSetTaskDoneMutation() {
  return useAppMutation({ mutationFn: setTaskDone, invalidate: [saleTaskKeys.all] })
}

async function deleteTask(id: string) {
  unwrap(await supabase.from('sale_tasks').delete().eq('id', id))
}

export function useDeleteTaskMutation() {
  return useAppMutation({ mutationFn: deleteTask, invalidate: [saleTaskKeys.all], success: 'Task deleted' })
}
