import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CompanyMonth, Month } from '@/lib/accounting'
import { formatAudShort, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

/** The trend chart's numbers as a table (newest first). */
export function TrendTable({ months, selected }: { months: CompanyMonth[]; selected: Month }) {
  return (
    <div className="h-72 overflow-auto rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="pl-3">Month</TableHead>
            <TableHead className="text-right">Cash in</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="pr-3 text-right">Company profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...months].reverse().map((m) => (
            <TableRow key={m.month} className={cn(m.month === selected && 'bg-accent/60')}>
              <TableCell className="pl-3 font-semibold">{formatMonth(m.month)}</TableCell>
              <TableCell className="money text-right">{formatAudShort(m.cashIn)}</TableCell>
              <TableCell className="money text-right">{formatAudShort(m.expenses)}</TableCell>
              <TableCell className={cn('money pr-3 text-right font-bold', m.companyProfit < 0 && 'text-danger')}>
                {formatAudShort(m.companyProfit)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
