import { ArrowRightIcon, CircleCheckIcon, ListTodoIcon } from 'lucide-react'
import { Link } from 'react-router'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import type { SaleTask } from '@/features/sales/api/tasks'
import { DueChip } from '@/features/sales/components/crm/DueChip'
import { SOON_DAYS } from '@/features/sales/crm'
import { saleHref } from '@/features/sales/links'
import type { IsoDate } from '@/lib/accounting'
import { ListRowsSkeleton } from './AttentionList'

interface TasksDueListProps {
  /** Already filtered to overdue + due soon, and sorted. Null while tasks load. */
  tasks: SaleTask[] | null
  overdue: number
  today: IsoDate
  limit?: number
}

/** Follow-ups that need doing now, across every sale, linking to each sale's page. */
export function TasksDueList({ tasks, overdue, today, limit = 6 }: TasksDueListProps) {
  return (
    <section className="flex flex-col rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <ListTodoIcon className="size-4 text-muted-foreground" />
            Tasks to do
          </h2>
          <p className="text-xs text-muted-foreground">Overdue or due in the next {SOON_DAYS} days</p>
        </div>
        {tasks ? (
          <p className="text-right">
            <span className="money block text-lg font-extrabold">{tasks.length}</span>
            {overdue > 0 && <span className="text-[11px] font-bold text-danger">{overdue} overdue</span>}
          </p>
        ) : (
          <SkeletonText size="lg" align="right" className="w-6" />
        )}
      </div>

      {!tasks ? (
        <ListRowsSkeleton rows={limit} right="chip" />
      ) : tasks.length === 0 ? (
        <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <CircleCheckIcon className="size-4 text-success" />
          Nothing due this week.
        </p>
      ) : (
        <ul className="divide-y">
          {tasks.slice(0, limit).map((t) => (
            <li key={t.id}>
              <Link to={t.saleId ? saleHref(t.saleId) : '/tasks'} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t.clientName ?? 'General task'}</span>
                </span>
                {t.dueOn && <DueChip dueOn={t.dueOn} today={today} />}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        to={overdue > 0 ? '/tasks?tab=overdue' : '/tasks'}
        className="mt-auto flex items-center justify-center gap-1 border-t p-2.5 text-xs font-semibold text-primary hover:bg-muted/50"
      >
        {overdue > 0 ? `See ${overdue} overdue` : 'All tasks'}
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </section>
  )
}
