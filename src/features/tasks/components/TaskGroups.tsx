import { useState } from 'react'
import { BriefcaseIcon } from 'lucide-react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { LoadingRegion, SkeletonText } from '@/components/feedback/SkeletonText'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteTaskMutation, type SaleTask } from '@/features/sales/api/tasks'
import { TaskDialog } from '@/features/sales/components/crm/TaskDialog'
import { TaskItem, TaskItemSkeleton } from '@/features/sales/components/crm/TaskItem'
import { saleHref } from '@/features/sales/links'
import type { IsoDate } from '@/lib/accounting'
import { cn } from '@/lib/utils'
import type { TaskGroup, TaskRow } from '../filters'

const DOT: Record<TaskGroup['key'], string> = {
  overdue: 'bg-danger',
  today: 'bg-warning',
  soon: 'bg-info',
  later: 'bg-muted-foreground',
  none: 'bg-border',
  done: 'bg-success',
}

/** Client (links to the sale page), then course · seller · RTO. A general task says so. */
function SaleLine({ task }: { task: TaskRow }) {
  const s = task.sale
  if (!task.saleId) {
    return (
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <BriefcaseIcon className="size-3" />
        General task
      </p>
    )
  }
  return (
    <p className="mt-0.5 truncate text-xs text-muted-foreground">
      <Link to={saleHref(task.saleId)} className="font-semibold text-primary underline-offset-2 hover:underline">
        {task.clientName}
      </Link>
      {s && [s.courseName, s.sellerName, s.rtoName].filter(Boolean).map((v) => <span key={v}> · {v}</span>)}
      {s?.cancelled && <span className="font-semibold"> · Cancelled sale</span>}
    </p>
  )
}

/** The task groups while tasks load: two group cards of placeholder rows. */
export function TaskGroupsSkeleton() {
  return (
    <LoadingRegion label="Loading tasks" className="space-y-5">
      {[3, 4].map((rows, g) => (
        <section key={g} className="space-y-2" aria-hidden>
          <div className="flex h-5 items-center gap-2">
            <Skeleton className="size-2 rounded-full" />
            <SkeletonText className={g ? 'w-20' : 'w-16'} />
          </div>
          <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
            {Array.from({ length: rows }, (_, i) => (
              <TaskItemSkeleton key={i} i={i + g} />
            ))}
          </ul>
        </section>
      ))}
    </LoadingRegion>
  )
}

/** Tasks in urgency groups (Overdue, Due today, …, Done), each group a card. */
export function TaskGroups({ groups, today }: { groups: TaskGroup[]; today: IsoDate }) {
  const [editing, setEditing] = useState<SaleTask | null>(null)
  const [deleting, setDeleting] = useState<SaleTask | null>(null)
  const remove = useDeleteTaskMutation()

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`tasks-${g.key}`} className="space-y-2">
          <h2 id={`tasks-${g.key}`} className="flex items-center gap-2 text-sm font-bold">
            <span className={cn('size-2 rounded-full', DOT[g.key])} />
            {g.label}
            <span className="text-xs font-medium text-muted-foreground">({g.tasks.length})</span>
          </h2>
          <ul className={cn('divide-y rounded-xl bg-card ring-1 ring-foreground/10', g.key === 'done' && 'bg-card/60')}>
            {g.tasks.map((t) => (
              <TaskItem key={t.id} task={t} today={today} onEdit={setEditing} onDelete={setDeleting} context={<SaleLine task={t} />} />
            ))}
          </ul>
        </section>
      ))}

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
    </div>
  )
}
