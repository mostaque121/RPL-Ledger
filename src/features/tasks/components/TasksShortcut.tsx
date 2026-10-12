import { useMemo } from 'react'
import { ListTodoIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSaleTasksQuery } from '@/features/sales/api/tasks'
import { taskDue } from '@/features/sales/crm'
import { todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'

/** The top bar's tasks icon: a badge with the open tasks, red when some are overdue. Overdue ones open first. */
export function TasksShortcut() {
  const tasks = useSaleTasksQuery().data
  const today = todayInSydney()

  const counts = useMemo(() => {
    const open = (tasks ?? []).filter((t) => !t.doneAt)
    return { open: open.length, overdue: open.filter((t) => taskDue(t.dueOn, today) === 'overdue').length }
  }, [tasks, today])

  const label =
    counts.open === 0
      ? 'Tasks · nothing open'
      : `Tasks · ${counts.open} open${counts.overdue > 0 ? `, ${counts.overdue} overdue` : ''}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link to={counts.overdue > 0 ? '/tasks?tab=overdue' : '/tasks'} aria-label={label}>
            <ListTodoIcon />
            {counts.open > 0 && (
              <span
                aria-hidden
                className={cn(
                  'money absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] leading-none font-bold ring-2 ring-background',
                  counts.overdue > 0 ? 'bg-danger text-danger-foreground' : 'bg-primary text-primary-foreground',
                )}
              >
                {counts.open > 99 ? '99+' : counts.open}
              </span>
            )}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
