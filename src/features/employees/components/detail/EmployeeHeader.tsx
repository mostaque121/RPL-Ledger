import { ExternalLinkIcon, PencilIcon, WalletIcon } from 'lucide-react'
import { Link } from 'react-router'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Panel } from '@/features/sales/components/detail/Panel'
import { formatBdt, formatDate } from '@/lib/format'
import type { Person } from '../../api'
import type { Period } from '../../stats'

interface EmployeeHeaderProps {
  employee: Person
  /** Their first sale or pay date, if any. */
  since: string | null
  period: Period
  onEditPay: () => void
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

function Links({ employeeId, period }: { employeeId: string; period: Period }) {
  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link to={`/sales?month=${period}&sellerId=${employeeId}`}>
          <ExternalLinkIcon />
          In Sales
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link to={`/expenses?month=${period}&employeeId=${employeeId}`}>
          <WalletIcon />
          In Expenses
        </Link>
      </Button>
    </>
  )
}

const PANEL = 'flex flex-wrap items-center gap-4 p-4 sm:p-5'

/** The header while the employee loads. The links only need the id and period, so they work already. */
export function EmployeeHeaderSkeleton({ employeeId, period }: { employeeId: string; period: Period }) {
  return (
    <Panel className={PANEL}>
      <Skeleton className="size-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <SkeletonText size="lg" className="w-32" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <SkeletonText className="w-72 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled>
          <PencilIcon />
          Edit pay
        </Button>
        <Links employeeId={employeeId} period={period} />
      </div>
    </Panel>
  )
}

/** Who they are, what they're paid now, and links to their rows elsewhere. */
export function EmployeeHeader({ employee, since, period, onEditPay }: EmployeeHeaderProps) {
  const pay = [
    employee.salaryBdt !== null ? `${formatBdt(employee.salaryBdt)} a month` : 'no salary set',
    employee.commissionPerSaleBdt !== null ? `${formatBdt(employee.commissionPerSaleBdt)} per sale` : 'no commission set',
  ].join(' · ')

  return (
    <Panel className={PANEL}>
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-base font-extrabold text-primary-foreground"
      >
        {initials(employee.name) || '?'}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg leading-tight font-extrabold tracking-tight">{employee.name}</h2>
          <StatusBadge tone={employee.active ? 'success' : 'muted'}>{employee.active ? 'Active' : 'Inactive'}</StatusBadge>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="money">{pay}</span>
          {since && <> · since {formatDate(since)}</>}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEditPay}>
          <PencilIcon />
          Edit pay
        </Button>
        <Links employeeId={employee.id} period={period} />
      </div>
    </Panel>
  )
}
