import { useState } from 'react'
import { BriefcaseIcon } from 'lucide-react'
import { Link } from 'react-router'
import { FILL_CARD, FILL_ROWS, TABLE_CARD } from '@/components/data/table-styles'
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

/** Groups after the first get a line above their heading. */
const GROUP = 'border-t first:border-t-0'

/** A group's heading: a band like the tables' header row, that stays at the top while its tasks scroll under it. */
const GROUP_HEAD = 'sticky top-0 z-10 flex h-9 items-center gap-2 border-b bg-table-head px-3 text-sm font-bold text-table-head-foreground'

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

/** The task groups while tasks load: two groups of placeholder rows. */
export function TaskGroupsSkeleton() {
  return (
    <LoadingRegion label="Loading tasks" className={cn(TABLE_CARD, FILL_CARD)}>
      <div className={FILL_ROWS}>
        {[3, 4].map((rows, g) => (
          <section key={g} aria-hidden className={GROUP}>
            <div className={GROUP_HEAD}>
              <Skeleton className="size-2 rounded-full" />
              <SkeletonText className={g ? 'w-20' : 'w-16'} />
            </div>
            <ul className="divide-y">
              {Array.from({ length: rows }, (_, i) => (
                <TaskItemSkeleton key={i} i={i + g} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </LoadingRegion>
  )
}

/** Tasks in urgency groups (Overdue, Due today, …, Done) in one card. On desktop only the tasks scroll, under sticky group headings. */
export function TaskGroups({ groups, today }: { groups: TaskGroup[]; today: IsoDate }) {
  const [editing, setEditing] = useState<SaleTask | null>(null)
  const [deleting, setDeleting] = useState<SaleTask | null>(null)
  const remove = useDeleteTaskMutation()

  return (
    <div className={cn(TABLE_CARD, FILL_CARD)}>
      <div className={FILL_ROWS}>
        {groups.map((g) => (
          <section key={g.key} aria-labelledby={`tasks-${g.key}`} className={GROUP}>
            <h2 id={`tasks-${g.key}`} className={GROUP_HEAD}>
              <span className={cn('size-2 rounded-full', DOT[g.key])} />
              {g.label}
              <span className="text-xs font-medium text-muted-foreground">({g.tasks.length})</span>
            </h2>
            <ul className={cn('divide-y', g.key === 'done' && 'bg-muted/30')}>
              {g.tasks.map((t) => (
                <TaskItem key={t.id} task={t} today={today} onEdit={setEditing} onDelete={setDeleting} context={<SaleLine task={t} />} />
              ))}
            </ul>
          </section>
        ))}
      </div>

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
