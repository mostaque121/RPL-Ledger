import { profitSplit, saleProfit, type Settings } from '@/lib/accounting'
import { formatAud } from '@/lib/format'

/** The worked example from the rules (profit A$1,050 on an employee sale), with the current settings. */
const EXAMPLE_PROFIT = 105_000

export function ShareExample({ settings }: { settings: Settings }) {
  const { tax, netProfit } = saleProfit({ courseFee: EXAMPLE_PROFIT, rtoCost: 0, referralCommission: 0 }, settings)
  const split = profitSplit('employee', netProfit, settings)
  const mdShare = 100 - settings.tanvirShare

  const steps = [
    { label: 'Employee sale profit', value: EXAMPLE_PROFIT, tone: '' },
    { label: `Tax ${settings.taxPct}%`, value: -tax, tone: 'text-danger' },
    { label: 'Net profit', value: netProfit, tone: 'font-bold' },
  ]

  return (
    <div className="max-w-md rounded-lg border bg-muted/40 p-4">
      <dl className="space-y-1 text-sm">
        {steps.map((s) => (
          <div key={s.label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{s.label}</dt>
            <dd className={`money ${s.tone}`}>{formatAud(s.value)}</dd>
          </div>
        ))}
      </dl>

      {/* split bar */}
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
        <div className="bg-primary" style={{ width: `${settings.tanvirShare}%` }} />
        <div className="bg-info" style={{ width: `${mdShare}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          Tanvir <span className="money font-bold">{formatAud(split.tanvir)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-info" />
          MD <span className="money font-bold">{formatAud(split.md)}</span>
        </span>
      </div>
    </div>
  )
}
