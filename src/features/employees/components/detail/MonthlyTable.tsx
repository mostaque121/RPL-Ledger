import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Month } from '@/lib/accounting'
import { formatAud, formatBdt, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EmployeeMonth, Paid } from '../../stats'

const Dash = () => <span className="text-muted-foreground/60">—</span>

function PaidCell({ paid }: { paid: Paid }) {
  if (paid.count === 0) return <Dash />
  return (
    <div className="leading-tight">
      <p className="money font-semibold">{paid.bdt ? formatBdt(paid.bdt) : formatAud(paid.aud)}</p>
      {paid.bdt > 0 && <p className="money text-[11px] text-muted-foreground">{formatAud(paid.aud)}</p>}
    </div>
  )
}

/** One row per month with activity: sales, completions, profit brought in, and what they were paid. */
export function MonthlyTable({ months, highlight }: { months: EmployeeMonth[]; highlight: Month }) {
  if (months.length === 0) {
    return <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="pl-3">Month</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Completed</TableHead>
            <TableHead className="text-right">Net profit</TableHead>
            <TableHead className="text-right">Salary</TableHead>
            <TableHead className="pr-3 text-right">Commission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((m) => (
            <TableRow key={m.month} className={cn(m.month === highlight && 'bg-accent/60')}>
              <TableCell className="pl-3 font-semibold whitespace-nowrap">{formatMonth(m.month)}</TableCell>
              <TableCell className="money text-right font-bold">{m.sales || <Dash />}</TableCell>
              <TableCell className="money text-right">{m.completed || <Dash />}</TableCell>
              <TableCell className="text-right">
                {m.completed ? <span className="money font-semibold text-success">{formatAud(m.netProfit)}</span> : <Dash />}
              </TableCell>
              <TableCell className="text-right">
                <PaidCell paid={m.salary} />
              </TableCell>
              <TableCell className="pr-3 text-right">
                <PaidCell paid={m.commission} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
