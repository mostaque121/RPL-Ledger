import type { ReactNode } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import type { IsoDate } from '@/lib/accounting'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSetTaskDoneMutation, type SaleTask } from '../../api/tasks'
import { DueChip } from './DueChip'

interface TaskItemProps {
  task: SaleTask
  today: IsoDate
  onEdit: (task: SaleTask) => void
  onDelete: (task: SaleTask) => void
  /** Extra line under the title, e.g. the client and course on the Tasks page. */
  context?: ReactNode
  className?: string
}

const TITLE_WIDTHS = ['w-56', 'w-40', 'w-64', 'w-48'] as const
const CONTEXT_WIDTHS = ['w-72', 'w-60', 'w-80', 'w-52'] as const

/** A task while loading, shaped like `TaskItem`: checkbox, title, an optional context line, due chip. */
export function TaskItemSkeleton({ i, context = true, className }: { i: number; context?: boolean; className?: string }) {
  return (
    <li aria-hidden className={cn('flex items-start gap-3 px-3 py-2.5', className)}>
      <Skeleton className="mt-0.5 size-4 shrink-0 rounded-[4px]" />
      <div className="min-w-0 flex-1">
        <SkeletonText className={cn('max-w-full', pickWidth(TITLE_WIDTHS, i))} />
        {context && <SkeletonText size="xs" className={cn('mt-0.5 max-w-full', pickWidth(CONTEXT_WIDTHS, i))} />}
        <Skeleton className="mt-1 h-5 w-20 rounded-full" />
      </div>
    </li>
  )
}

/** One task: tick it off, see when it's due, edit or delete it. */
export function TaskItem({ task, today, onEdit, onDelete, context, className }: TaskItemProps) {
  const toggle = useSetTaskDoneMutation()
  // Show the new state straight away while it saves.
  const done = toggle.isPending ? toggle.variables.done : task.doneAt !== null
  const checkboxId = `task-${task.id}`

  return (
    <li className={cn('group flex items-start gap-3 px-3 py-2.5', className)}>
      <Checkbox
        id={checkboxId}
        className="mt-0.5"
        checked={done}
        disabled={toggle.isPending}
        onCheckedChange={(checked) => toggle.mutate({ id: task.id, done: checked === true })}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={checkboxId}
          className={cn('block cursor-pointer text-sm font-medium break-words', done && 'text-muted-foreground line-through')}
        >
          {task.title}
        </label>
        {context}
        {(task.dueOn || (done && task.doneAt)) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            {task.dueOn && <DueChip dueOn={task.dueOn} today={today} done={done} />}
            {done && task.doneAt && <span>Done {formatDateTime(task.doneAt)}</span>}
          </div>
        )}
      </div>
      <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        {!done && (
          <Button variant="ghost" size="icon-sm" aria-label="Edit task" onClick={() => onEdit(task)}>
            <PencilIcon />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" className="hover:text-danger" aria-label="Delete task" onClick={() => onDelete(task)}>
          <Trash2Icon />
        </Button>
      </div>
    </li>
  )
}
