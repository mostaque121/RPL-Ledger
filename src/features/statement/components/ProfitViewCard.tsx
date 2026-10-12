import { SkeletonText } from '@/components/feedback/SkeletonText'
import { formatAudShort } from '@/lib/format'
import type { ProfitView } from '@/lib/accounting'
import { cn } from '@/lib/utils'

interface ProfitViewCardProps {
  /** Null while sales and expenses load: the labels stay, the figures wait. */
  profit: ProfitView | null
  names: { tanvir: string; md: string }
}

/** Performance view: profit of sales completed this month, before cash timing. */
export function ProfitViewCard({ profit, names }: ProfitViewCardProps) {
  const rows = [
    { label: 'Profit of sales completed', value: profit?.salesProfit },
    { label: 'All expenses', value: profit ? -profit.expenses : undefined },
    { label: 'Company profit (before tax)', value: profit?.companyProfit, strong: true },
  ]
  const partners = [
    { label: `${names.tanvir}'s profit`, value: profit?.partnerProfit.tanvir, dot: 'bg-primary' },
    { label: `${names.md}'s profit`, value: profit?.partnerProfit.md, dot: 'bg-info' },
  ]
  const tone = (v: number) => (v < 0 ? 'text-danger' : 'text-success')
  const waiting = <SkeletonText className="w-16" />

  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 print:break-inside-avoid">
      <h2 className="text-sm font-bold">Profit view</h2>
      <p className="text-xs text-muted-foreground">
        Performance, not cash: profit counts when a sale is completed. Partner profit is net of tax, plus the employee
        share, minus the expense share.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <dl className="space-y-1.5 text-sm">
          {rows.map((r) => (
            <div key={r.label} className={cn('flex justify-between gap-3', r.strong && 'border-t pt-1.5')}>
              <dt className={r.strong ? 'font-bold' : 'text-muted-foreground'}>{r.label}</dt>
              {r.value === undefined ? (
                waiting
              ) : (
                <dd className={cn('money', r.strong && cn('font-extrabold', tone(r.value)))}>{formatAudShort(r.value)}</dd>
              )}
            </div>
          ))}
        </dl>
        <dl className="space-y-1.5 text-sm">
          {partners.map((p) => (
            <div key={p.label} className="flex justify-between gap-3">
              <dt className="flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', p.dot)} />
                {p.label}
              </dt>
              {p.value === undefined ? waiting : <dd className={cn('money font-bold', tone(p.value))}>{formatAudShort(p.value)}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
