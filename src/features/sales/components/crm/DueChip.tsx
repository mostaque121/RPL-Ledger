import { CalendarClockIcon } from 'lucide-react'
import type { IsoDate } from '@/lib/accounting'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dueLabel, taskDue, type TaskDue } from '../../crm'

const TONE: Record<TaskDue, string> = {
  overdue: 'bg-danger/15 text-danger ring-danger/30',
  today: 'bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning',
  soon: 'bg-info/15 text-info ring-info/30',
  later: 'bg-muted text-muted-foreground ring-border',
  none: 'bg-muted text-muted-foreground ring-border',
}

/** "Today", "3 days overdue", … coloured by urgency. Done tasks show the plain date. */
export function DueChip({ dueOn, today, done }: { dueOn: IsoDate; today: IsoDate; done?: boolean }) {
  const due = done ? 'later' : taskDue(dueOn, today)
  return (
    <span
      title={formatDate(dueOn)}
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[11px] font-bold whitespace-nowrap ring-1 ring-inset',
        TONE[due],
      )}
    >
      <CalendarClockIcon className="size-3" />
      {done ? formatDate(dueOn) : dueLabel(dueOn, today)}
    </span>
  )
}
