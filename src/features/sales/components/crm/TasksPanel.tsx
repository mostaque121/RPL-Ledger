import { useMemo, useState } from 'react'
import { ChevronDownIcon, ListTodoIcon, PartyPopperIcon } from 'lucide-react'
import { AddButton, LIST_CARD, SectionEmpty, SectionHeader } from '@/components/data/Section'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDeleteTaskMutation, useSaleTasksQuery, type SaleTask } from '../../api/tasks'
import { sortTasks } from '../../crm'
import { TaskDialog } from './TaskDialog'
import { TaskItem, TaskItemSkeleton } from './TaskItem'

/** Follow-ups for one sale: open ones first (soonest due on top), done ones folded away. */
export function TasksPanel({ saleId }: { saleId: string }) {
  const tasks = useSaleTasksQuery()
  const remove = useDeleteTaskMutation()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<SaleTask | null>(null)
  const [deleting, setDeleting] = useState<SaleTask | null>(null)
  const [showDone, setShowDone] = useState(false)
  const today = todayInSydney()

  const { open, done } = useMemo(() => {
    const mine = sortTasks((tasks.data ?? []).filter((t) => t.saleId === saleId))
    return { open: mine.filter((t) => !t.doneAt), done: mine.filter((t) => t.doneAt) }
  }, [tasks.data, saleId])

  const item = (t: SaleTask) => (
    <TaskItem key={t.id} task={t} today={today} onEdit={setEditing} onDelete={setDeleting} className={cn(LIST_CARD, 'px-3')} />
  )

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={ListTodoIcon}
        title="Tasks"
        count={open.length}
        action={<AddButton onClick={() => setAdding(true)}>Add task</AddButton>}
      />

      {tasks.isPending ? (
        <ul className="space-y-2" role="status" aria-label="Loading tasks">
          {[0, 1].map((i) => (
            <TaskItemSkeleton key={i} i={i} context={false} className={cn(LIST_CARD, 'px-3 hover:shadow-none')} />
          ))}
        </ul>
      ) : tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : (
        <>
          {open.length > 0 ? (
            <ul className="space-y-2">{open.map(item)}</ul>
          ) : (
            <SectionEmpty icon={done.length > 0 ? PartyPopperIcon : ListTodoIcon}>
              {done.length > 0 ? 'All done.' : 'No tasks yet. Add a follow-up, e.g. "Ask for the USI".'}
            </SectionEmpty>
          )}

          {done.length > 0 && (
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}>
                <ChevronDownIcon className={cn('transition-transform', !showDone && '-rotate-90')} />
                Done ({done.length})
              </Button>
              {showDone && <ul className="space-y-2 opacity-80">{done.map(item)}</ul>}
            </div>
          )}
        </>
      )}

      {adding && <TaskDialog saleId={saleId} onOpenChange={setAdding} />}
      {editing && <TaskDialog task={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? `Delete "${deleting.title}"?` : ''}
        description="This can't be undone. Tick it off instead if it's been done."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => deleting && remove.mutateAsync(deleting.id)}
      />
    </section>
  )
}
